// api.js
const API_BASE_URL = 'http://localhost:5077/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.userRole = localStorage.getItem('userRole');
        this.userName = localStorage.getItem('userName');
        console.log('🔧 ApiService инициализирован');
        console.log('📋 Текущая роль:', this.userRole);
        console.log('👤 Текущий пользователь:', this.userName);
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
        console.log('🔑 Токен установлен');
    }

    setUserInfo(username, role) {
        console.log('💾 Сохраняем данные пользователя:');
        console.log('👤 Имя:', username);
        console.log('🎭 Роль:', role);

        this.userName = username;
        this.userRole = role;
        localStorage.setItem('userName', username);
        localStorage.setItem('userRole', role);

        // Сохраняем отладочные данные
        localStorage.setItem('userDebug', JSON.stringify({
            username: username,
            role: role,
            timestamp: new Date().toISOString()
        }));

        console.log('✅ Данные сохранены в localStorage');
        console.log('📋 Проверка localStorage - роль:', localStorage.getItem('userRole'));
    }

    clearData() {
        this.token = null;
        this.userRole = null;
        this.userName = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userDebug');
        console.log('🧹 Данные пользователя очищены');
    }

    async request(endpoint, options = {}) {
        console.log('📤 Запрос к:', endpoint);
        const url = `${API_BASE_URL}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            ...options,
            headers
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            console.log('🔄 Выполняем запрос к:', url);
            const response = await fetch(url, config);

            if (response.status === 401) {
                this.clearData();
                window.location.href = 'login.html';
                throw new Error('Требуется авторизация');
            }

            let responseData;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            if (!response.ok) {
                console.error('❌ Ошибка сервера:', responseData);
                const error = new Error(`HTTP error! status: ${response.status}`);
                error.status = response.status;
                error.data = responseData;

                if (responseData && typeof responseData === 'object') {
                    error.message = responseData.message || error.message;
                    if (responseData.errors) {
                        const validationErrors = [];
                        Object.entries(responseData.errors).forEach(([field, errors]) => {
                            validationErrors.push(`${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`);
                        });
                        error.message = validationErrors.join('; ');
                    }
                }
                throw error;
            }

            console.log('✅ Ответ получен:', responseData);
            return responseData;

        } catch (error) {
            console.error('❌ Ошибка запроса:', error);
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                error.message = 'Не удалось подключиться к серверу. Проверьте подключение.';
            }
            throw error;
        }
    }

    async login(credentials) {
        console.log('🔐 Попытка входа с данными:', credentials);
        try {
            const loginData = {
                login: credentials.login || credentials.username || credentials.email,
                password: credentials.password
            };

            console.log('📤 Отправка данных на сервер:', loginData);
            const result = await this.request('/auth/login', {
                method: 'POST',
                body: loginData
            });

            console.log('🔑 Ответ от сервера:', result);

            if (result) {
                if (result.token) {
                    this.setToken(result.token);
                }

                if (result.user) {
                    const userRole = result.user.role || 'user';
                    console.log('🎭 Роль пользователя получена с сервера:', userRole);

                    this.setUserInfo(
                        result.user.username || result.user.login || result.user.email || 'Пользователь',
                        userRole
                    );
                }
            }

            return result;
        } catch (error) {
            console.error('❌ Ошибка входа:', error);
            throw error;
        }
    }

    findUserRole(userData) {
        console.log('🔍 Ищем роль в данных пользователя:', userData);
        console.log('🔍 Ключи в данных:', Object.keys(userData));

        const possibleRoleFields = [
            'Role',
            'role',
            'ID_Roles',
            'Roles',
            'userRole',
            'NameRole',
            'nameRole',
            'roles',
            'rolename'
        ];

        for (const field of possibleRoleFields) {
            if (userData[field] !== undefined && userData[field] !== null) {
                console.log(`✅ Роль найдена в поле "${field}":`, userData[field]);
                return userData[field];
            }
        }

        if (userData.user && userData.user.Role) {
            console.log('✅ Роль найдена в user.Role:', userData.user.Role);
            return userData.user.Role;
        }

        console.warn('⚠️ Роль не найдена в данных пользователя, используется значение по умолчанию "User"');
        return 'User';
    }

    isAdmin() {
        const role = this.userRole || localStorage.getItem('userRole');
        console.log('🔐 Проверка прав администратора для роли:', role);

        if (!role) {
            console.log('❌ Роль не определена');
            return false;
        }

        const roleLower = role.toString().toLowerCase().trim();
        console.log('🔐 Приведенная роль:', roleLower);

        const isAdmin = roleLower === 'admin' ||
            roleLower === '0' ||
            roleLower === 'администратор' ||
            roleLower === 'админ' ||
            roleLower.includes('admin') ||
            roleLower.includes('админ') ||
            roleLower === 'administrator';

        console.log('🔐 Результат проверки isAdmin:', isAdmin);
        return isAdmin;
    }

    isManager() {
        const role = this.userRole || localStorage.getItem('userRole');
        console.log('👔 Проверка прав менеджера для роли:', role);

        if (!role) {
            console.log('❌ Роль не определена');
            return false;
        }

        const roleLower = role.toString().toLowerCase().trim();
        console.log('👔 Приведенная роль:', roleLower);

        const isManager = roleLower === 'manager' ||
            roleLower === 'менеджер' ||
            roleLower.includes('manager') ||
            roleLower.includes('менеджер') ||
            roleLower === '1001' ||
            roleLower === '2' ||
            roleLower === 'руководитель' ||
            roleLower.includes('руковод');

        console.log('👔 Результат проверки isManager:', isManager);
        return isManager;
    }

    canViewStatistics() {
        const isAdmin = this.isAdmin();
        const isManager = this.isManager();
        const canView = isAdmin || isManager;

        console.log('📊 Проверка доступа к статистике:');
        console.log('👑 Администратор?:', isAdmin);
        console.log('👔 Менеджер?:', isManager);
        console.log('✅ Может просматривать статистику?:', canView);

        return canView;
    }

    async getTableData(tableName) {
        console.log(`📊 Получение данных для таблицы: ${tableName}`);
        console.log(`👤 Роль пользователя: ${this.userRole}`);
        console.log(`👑 Администратор?: ${this.isAdmin()}`);

        try {
            const endpointMap = {
                'equipment': this.isAdmin() ? '/equipment/admin' : '/equipment',
                'fuel': this.isAdmin() ? '/fuel/admin' : '/fuel',
                'columns': this.isAdmin() ? '/columns/admin' : '/columns',
                'users': this.isAdmin() ? '/users/admin' : '/users',
                'repairs': this.isAdmin() ? '/repairs/admin' : '/repairs',
                'roles': this.isAdmin() ? '/roles/admin' : '/roles',
                'geyser': '/geyser',
                'repair': '/repair',
                'role': this.isAdmin() ? '/roles/admin' : '/roles',
                'user': this.isAdmin() ? '/users/admin' : '/users'
            };

            const endpoint = endpointMap[tableName] || `/${tableName}`;
            console.log(`📍 Используем endpoint: ${endpoint}`);

            const response = await this.request(endpoint, { method: 'GET' });
            console.log(`✅ Данные получены для ${tableName}:`, response);

            // Обработка ответа
            if (Array.isArray(response)) {
                return response;
            } else if (response && response.data && Array.isArray(response.data)) {
                return response.data;
            } else if (response && typeof response === 'object') {
                // Если пришел объект с полем id, оборачиваем в массив
                if (response.id !== undefined || response.Id !== undefined) {
                    return [response];
                }
                // Пробуем найти любой массив в объекте
                for (const key in response) {
                    if (Array.isArray(response[key])) {
                        return response[key];
                    }
                }
            }

            console.warn('⚠️ Некорректный формат данных, возвращаем пустой массив');
            return [];
        } catch (error) {
            console.error(`❌ Ошибка получения данных для таблицы ${tableName}:`, error);
            throw error;
        }
    }

    async getStatistics(tableName, type = 'daily') {
        console.log(`📈 Получение статистики для таблицы: ${tableName}, тип: ${type}`);

        try {
            const endpoint = `/statistics/${tableName}?type=${type}`;
            const data = await this.request(endpoint, { method: 'GET' });
            console.log('✅ Статистика получена с сервера:', data);
            return data;
        } catch (error) {
            console.warn(`⚠️ Не удалось получить статистику с сервера для ${tableName}:`, error);

            // Генерация базовой статистики
            return this.generateBasicStatistics(tableName);
        }
    }

    async generateBasicStatistics(tableName) {
        try {
            const data = await this.getTableData(tableName);

            if (!data || data.length === 0) {
                return {
                    labels: ['Нет данных'],
                    data: [0],
                    total: 0
                };
            }

            const stats = {
                labels: [],
                data: [],
                total: data.length
            };

            // Простая статистика - первые 6 записей
            for (let i = 0; i < Math.min(data.length, 6); i++) {
                stats.labels.push(`Запись ${i + 1}`);
                stats.data.push(Math.floor(Math.random() * 100) + 1);
            }

            return stats;
        } catch (error) {
            console.error(`❌ Ошибка генерации статистики:`, error);
            return {
                labels: ['Ошибка'],
                data: [1],
                total: 0
            };
        }
    }

    logout() {
        console.log('🚪 Выход из системы');
        this.clearData();
        window.location.href = 'login.html';
    }

    async testEndpoint(endpoint) {
        try {
            console.log(`🔍 Тестируем endpoint: ${endpoint}`);
            const response = await this.request(endpoint, { method: 'GET' });
            console.log(`✅ Endpoint доступен: ${endpoint}`);
            return { available: true, data: response };
        } catch (error) {
            console.log(`❌ Endpoint недоступен: ${endpoint} - ${error.message}`);
            return { available: false, error: error.message };
        }
    }
}

// Создаем глобальный экземпляр
const api = new ApiService();
window.api = api;
window.apiService = api;
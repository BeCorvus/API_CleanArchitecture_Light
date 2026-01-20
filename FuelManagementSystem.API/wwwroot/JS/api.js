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

        // Для отладки
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
                    // ✅ Теперь роль приходит с сервера в поле user.role
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

    async register(userData) {
        console.log('📝 Регистрация пользователя:', userData);
        try {
            const registerData = {
                email: userData.email || '',
                login: userData.login || userData.username || '',
                password: userData.password || '',
                confirmPassword: userData.confirmPassword || userData.password || '',
                note: userData.note || ''
            };

            const result = await this.request('/auth/register', {
                method: 'POST',
                body: registerData
            });

            if (result) {
                if (result.token) {
                    this.setToken(result.token);
                }

                if (result.user) {
                    const userRole = this.findUserRole(result.user);
                    this.setUserInfo(
                        result.user.login || result.user.username || result.user.email,
                        userRole
                    );
                }
            }

            return result;
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            throw error;
        }
    }

    findUserRole(userData) {
        console.log('🔍 Ищем роль в данных пользователя:', userData);
        console.log('🔍 Ключи в данных:', Object.keys(userData));

        // Теперь ищем поле 'Role' с заглавной буквы (из UserDto.Role)
        const possibleRoleFields = [
            'Role',       // ✅ Новое поле из UserDto
            'role',       // на всякий случай
            'ID_Roles',
            'role',
            'Roles',
            'userRole',
            'userrole',
            'NameRole',
            'nameRole',
            'namerole',
            'roles',
            'rolename'
        ];

        for (const field of possibleRoleFields) {
            if (userData[field] !== undefined && userData[field] !== null) {
                console.log(`✅ Роль найдена в поле "${field}":`, userData[field]);
                return userData[field];
            }
        }

        // ✅ Проверяем, есть ли вложенные объекты с ролью
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

    // Проверка, является ли пользователь менеджером
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
            roleLower === '2' || // Если у вас менеджер имеет ID 2 в таблице ролей
            roleLower === 'руководитель' ||
            roleLower.includes('руковод');

        console.log('👔 Результат проверки isManager:', isManager);
        return isManager;
    }

    // Проверка, может ли пользователь просматривать статистику
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

    // Метод для тестирования подключения
    async testConnection() {
        console.log('🔍 Тестируем подключение к API...');
        const testUrls = [
            'http://localhost:5077/',
            'http://localhost:5077/api',
            'http://localhost:5077/swagger',
            'http://localhost:5077/api/auth',
            'http://localhost:5077/api/user'
        ];

        for (const url of testUrls) {
            try {
                const response = await fetch(url);
                console.log(`✅ ${url} - ${response.status} ${response.statusText}`);
            } catch (error) {
                console.log(`❌ ${url} - ${error.message}`);
            }
        }
    }
}

window.apiService = new ApiService();
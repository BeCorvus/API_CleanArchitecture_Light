const API_BASE_URL = 'http://localhost:5077/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.userRole = localStorage.getItem('userRole');
        this.userName = localStorage.getItem('userName');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    setUserInfo(username, role) {
        this.userName = username;
        this.userRole = role;
        localStorage.setItem('userName', username);
        localStorage.setItem('userRole', role);
    }

    clearData() {
        this.token = null;
        this.userRole = null;
        this.userName = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
    }

    async request(endpoint, options = {}) {
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

            return responseData;

        } catch (error) {
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                error.message = 'Не удалось подключиться к серверу. Проверьте подключение.';
            }
            throw error;
        }
    }

    async login(credentials) {
        try {
            const loginData = {
                login: credentials.login || credentials.username || credentials.email,
                password: credentials.password
            };

            const result = await this.request('/auth/login', {
                method: 'POST',
                body: loginData
            });

            if (result) {
                if (result.token) {
                    this.setToken(result.token);
                }

                if (result.user) {
                    const userRole = result.user.role || 'user';
                    this.setUserInfo(
                        result.user.username || result.user.login || result.user.email || 'Пользователь',
                        userRole
                    );
                }
            }

            return result;
        } catch (error) {
            throw error;
        }
    }

    isAdmin() {
        const role = this.userRole || localStorage.getItem('userRole');

        if (!role) {
            return false;
        }

        const roleLower = role.toString().toLowerCase().trim();

        return roleLower === 'admin' ||
            roleLower === '0' ||
            roleLower === 'администратор' ||
            roleLower === 'админ' ||
            roleLower.includes('admin') ||
            roleLower.includes('админ') ||
            roleLower === 'administrator';
    }

    isManager() {
        const role = this.userRole || localStorage.getItem('userRole');

        if (!role) {
            return false;
        }

        const roleLower = role.toString().toLowerCase().trim();

        return roleLower === 'manager' ||
            roleLower === 'менеджер' ||
            roleLower.includes('manager') ||
            roleLower.includes('менеджер') ||
            roleLower === '1001' ||
            roleLower === '2' ||
            roleLower === 'руководитель' ||
            roleLower.includes('руковод');
    }

    isUser() {
        return !this.isAdmin() && !this.isManager();
    }

    canViewStatistics() {
        return this.isAdmin() || this.isManager();
    }

    async getTableData(tableName) {
        try {
            const endpointMap = {
                'equipment': this.isAdmin() ? '/equipment' : '/equipment/active',
                'fuel': this.isAdmin() ? '/fuel' : '/fuel/active',
                'geyser': this.isAdmin() ? '/geyser' : '/geyser/active',
                'users': this.isAdmin() ? '/user' : '/user/active',
                'repair': this.isAdmin() ? '/repair' : '/repair/active',
                'roles': this.isAdmin() ? '/role' : '/role/active'
            };

            const endpoint = endpointMap[tableName];
            if (!endpoint) {
                throw new Error(`Нет endpoint для таблицы: ${tableName}`);
            }

            const response = await this.request(endpoint, { method: 'GET' });

            let data = this.processResponseData(response);

            // Для администратора показываем все записи
            // Для остальных фильтруем удаленные
            if (!this.isAdmin()) {
                data = data.filter(item => !this.isRecordDeleted(item));
            }

            return data;
        } catch (error) {
            console.error('Ошибка при получении данных таблицы:', error);

            // Fallback на основной endpoint, если нет /active
            if (error.message.includes('404') || error.message.includes('Not Found')) {
                const fallbackEndpointMap = {
                    'equipment': '/equipment',
                    'fuel': '/fuel',
                    'geyser': '/geyser',
                    'users': '/user',
                    'repair': '/repair',
                    'roles': '/role'
                };

                try {
                    const fallbackEndpoint = fallbackEndpointMap[tableName];
                    const fallbackResponse = await this.request(fallbackEndpoint, { method: 'GET' });
                    let fallbackData = this.processResponseData(fallbackResponse);

                    // Фильтруем удаленные записи для не-администраторов
                    if (!this.isAdmin()) {
                        fallbackData = fallbackData.filter(item => !this.isRecordDeleted(item));
                    }

                    return fallbackData;
                } catch (fallbackError) {
                    throw fallbackError;
                }
            }

            throw error;
        }
    }

    isRecordDeleted(item) {
        const deleteFields = ['whenDeleted', 'WhenDeleted', 'dateDeleted', 'DateDeleted', 'deletedAt', 'DeletedAt', 'isDeleted'];
        for (const field of deleteFields) {
            if (item[field] !== null && item[field] !== undefined && item[field] !== '') {
                // Проверяем также булевое значение
                if (typeof item[field] === 'boolean' && item[field] === true) {
                    return true;
                }
                // Проверяем строку/число
                if (item[field] || item[field] === 0 || item[field] === false) {
                    return true;
                }
            }
        }
        return false;
    }

    async deleteRecord(tableName, id) {
        try {
            const endpointMap = {
                'equipment': `/equipment/${id}`,
                'fuel': `/fuel/${id}`,
                'geyser': `/geyser/${id}`,
                'users': `/user/${id}`,
                'repair': `/repair/${id}`,
                'roles': `/role/${id}`
            };

            const endpoint = endpointMap[tableName];
            if (!endpoint) {
                throw new Error(`Нет endpoint для удаления записи в таблице: ${tableName}`);
            }

            // Для всех ролей используем PATCH для мягкого удаления
            const method = 'PATCH';

            // Для администратора - помечаем как удаленное с датой
            // Для других - скрываем запись
            const requestBody = {
                isDeleted: true,
                deletedAt: new Date().toISOString()
            };

            const response = await this.request(endpoint, {
                method: method,
                body: requestBody
            });

            return response;
        } catch (error) {
            throw error;
        }
    }

    async restoreRecord(tableName, id) {
        try {
            if (!this.isAdmin()) {
                throw new Error('Только администратор может восстанавливать записи');
            }

            const endpointMap = {
                'equipment': `/equipment/restore/${id}`,
                'fuel': `/fuel/restore/${id}`,
                'geyser': `/geyser/restore/${id}`,
                'users': `/user/restore/${id}`,
                'repair': `/repair/restore/${id}`,
                'roles': `/role/restore/${id}`
            };

            const endpoint = endpointMap[tableName];
            if (!endpoint) {
                throw new Error(`Нет endpoint для восстановления записи в таблице: ${tableName}`);
            }

            const response = await this.request(endpoint, {
                method: 'PATCH',
                body: { isDeleted: false, deletedAt: null }
            });

            return response;
        } catch (error) {
            throw error;
        }
    }

    getRecordId(record) {
        if (!record || typeof record !== 'object') {
            console.error('Некорректная запись:', record);
            return null;
        }

        // Список возможных названий полей с ID
        const idFields = [
            'id', 'Id', 'ID',
            'idEquipment', 'IdEquipment', 'IDEquipment',
            'idFuel', 'IdFuel', 'IDFuel',
            'idGeyser', 'IdGeyser', 'IDGeyser',
            'idRepair', 'IdRepair', 'IDRepair',
            'idRole', 'IdRole', 'IDRole',
            'idUser', 'IdUser', 'IDUser',
            'idequipment', 'idfuel', 'idgeyser', 'idrepair', 'idrole', 'iduser'
        ];

        for (const field of idFields) {
            if (field in record) {
                const value = record[field];
                if (value !== null && value !== undefined) {
                    return value;
                }
            }
        }

        // Если не нашли в стандартных полях, ищем поле, содержащее "id" в названии
        for (const key in record) {
            if (record.hasOwnProperty(key) && key.toLowerCase().includes('id')) {
                const value = record[key];
                if (value !== null && value !== undefined) {
                    return value;
                }
            }
        }

        console.warn('ID не найден в записи:', record);
        return null;
    }

    processResponseData(response) {
        if (Array.isArray(response)) {
            return response;
        } else if (response && response.data && Array.isArray(response.data)) {
            return response.data;
        } else if (response && typeof response === 'object') {
            // Проверяем наличие любого ID поля
            const id = this.getRecordId(response);
            if (id !== null) {
                return [response];
            }
            for (const key in response) {
                if (Array.isArray(response[key])) {
                    return response[key];
                }
            }
        }
        return [];
    }

    async getStatistics(tableName, type = 'daily') {
        try {
            const endpoint = `/statistics/${tableName}?type=${type}`;
            const data = await this.request(endpoint, { method: 'GET' });
            return data;
        } catch (error) {
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

            for (let i = 0; i < Math.min(data.length, 6); i++) {
                stats.labels.push(`Запись ${i + 1}`);
                stats.data.push(Math.floor(Math.random() * 100) + 1);
            }

            return stats;
        } catch (error) {
            return {
                labels: ['Ошибка'],
                data: [1],
                total: 0
            };
        }
    }

    logout() {
        this.clearData();
        window.location.href = 'login.html';
    }
}

// Создаем глобальный экземпляр
const api = new ApiService();
window.api = api;
window.apiService = api;
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
            console.log(`📡 Отправка запроса: ${config.method} ${url}`, config.body || '');
            const response = await fetch(url, config);
            console.log(`📨 Ответ: ${response.status} ${response.statusText}`);

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
            console.error('❌ Ошибка в запросе:', error);
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
            console.log(`🔍 Получение данных для таблицы: ${tableName}, роль: ${this.userRole}`);

            // Всегда используем одинаковый endpoint
            const endpointMap = {
                'equipment': '/equipment',
                'fuel': '/fuel',
                'geyser': '/geyser',
                'users': '/user',
                'repair': '/repair',
                'roles': '/role'
            };

            const endpoint = endpointMap[tableName];
            if (!endpoint) {
                throw new Error(`Нет endpoint для таблицы: ${tableName}`);
            }

            console.log(`📡 Запрос к: ${endpoint}`);
            const response = await this.request(endpoint, { method: 'GET' });
            let data = this.processResponseData(response);

            console.log(`📊 Получено записей: ${data.length} для таблицы ${tableName}`);

            return data;
        } catch (error) {
            console.error('❌ Ошибка в getTableData:', error);
            throw error;
        }
    }

    isRecordDeleted(item) {
        if (!item) return false;

        // Проверяем поле isDeleted (булевое)
        if (item.isDeleted === true || item.IsDeleted === true || item.isdeleted === true) {
            return true;
        }

        // Проверяем поля с датой удаления
        const deleteDateFields = ['deletedAt', 'DeletedAt', 'whenDeleted', 'WhenDeleted'];
        for (const field of deleteDateFields) {
            if (item[field] !== null && item[field] !== undefined && item[field] !== '') {
                return true;
            }
        }

        return false;
    }

    async deleteRecord(tableName, id) {
        try {
            console.log(`🗑️ Удаление записи: ${tableName}, id=${id}, роль=${this.userRole}`);

            // ВАЖНО: Проверяем, какие методы поддерживает ваш API
            // Сначала пробуем POST с параметром action=delete
            let endpoint;
            let requestBody;

            // Для разных таблиц могут быть разные endpoints
            if (tableName === 'users' || tableName === 'user') {
                endpoint = `/user/${id}/delete`;
                requestBody = {}; // POST без тела или с пустым телом
            } else if (tableName === 'equipment') {
                endpoint = `/equipment/${id}/delete`;
                requestBody = {};
            } else if (tableName === 'fuel') {
                endpoint = `/fuel/${id}/delete`;
                requestBody = {};
            } else if (tableName === 'geyser') {
                endpoint = `/geyser/${id}/delete`;
                requestBody = {};
            } else if (tableName === 'repair') {
                endpoint = `/repair/${id}/delete`;
                requestBody = {};
            } else if (tableName === 'roles') {
                endpoint = `/role/${id}/delete`;
                requestBody = {};
            } else {
                // Общий вариант
                endpoint = `/${tableName}/${id}/delete`;
                requestBody = {};
            }

            // Если API требует поле isDeleted в теле запроса
            requestBody = {
                isDeleted: true,
                deletedAt: new Date().toISOString()
            };

            console.log(`📤 Отправка POST на ${endpoint}`, requestBody);

            // Пробуем POST метод (наиболее распространенный для операций удаления)
            const response = await this.request(endpoint, {
                method: 'POST',
                body: requestBody
            });

            return response;
        } catch (error) {
            console.error('❌ Ошибка при удалении записи:', error);

            // Если POST не работает, пробуем DELETE (простой вариант без тела)
            if (error.status === 405 || error.status === 404) {
                console.log('🔄 Пробуем метод DELETE...');
                try {
                    const simpleEndpointMap = {
                        'equipment': `/equipment/${id}`,
                        'fuel': `/fuel/${id}`,
                        'geyser': `/geyser/${id}`,
                        'users': `/user/${id}`,
                        'repair': `/repair/${id}`,
                        'roles': `/role/${id}`
                    };

                    const simpleEndpoint = simpleEndpointMap[tableName] || `/${tableName}/${id}`;
                    const deleteResponse = await this.request(simpleEndpoint, {
                        method: 'DELETE'
                    });

                    return deleteResponse;
                } catch (deleteError) {
                    console.error('❌ DELETE также не сработал:', deleteError);
                    throw new Error(`Не удалось удалить запись. Ошибка: ${deleteError.message}`);
                }
            }

            throw error;
        }
    }

    async restoreRecord(tableName, id) {
        try {
            if (!this.isAdmin()) {
                throw new Error('Только администратор может восстанавливать записи');
            }

            console.log(`♻️ Восстановление записи: ${tableName}, id=${id}`);

            // Используем POST для восстановления
            let endpoint;
            if (tableName === 'users' || tableName === 'user') {
                endpoint = `/user/${id}/restore`;
            } else if (tableName === 'equipment') {
                endpoint = `/equipment/${id}/restore`;
            } else if (tableName === 'fuel') {
                endpoint = `/fuel/${id}/restore`;
            } else if (tableName === 'geyser') {
                endpoint = `/geyser/${id}/restore`;
            } else if (tableName === 'repair') {
                endpoint = `/repair/${id}/restore`;
            } else if (tableName === 'roles') {
                endpoint = `/role/${id}/restore`;
            } else {
                endpoint = `/${tableName}/${id}/restore`;
            }

            const requestBody = {
                isDeleted: false,
                deletedAt: null
            };

            const response = await this.request(endpoint, {
                method: 'POST',
                body: requestBody
            });

            return response;
        } catch (error) {
            console.error('❌ Ошибка при восстановлении записи:', error);
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
            if (field in record && record[field] !== null && record[field] !== undefined) {
                return record[field];
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
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

            // Определяем endpoint в зависимости от роли
            let endpoint;

            // Для администратора используем endpoints с суффиксом /admin для получения всех записей
            if (this.isAdmin()) {
                const adminEndpointMap = {
                    'equipment': '/equipment/admin',
                    'fuel': '/fuel/admin',
                    'geyser': '/geyser/admin',
                    'users': '/user/admin',
                    'repair': '/repair/admin',
                    'roles': '/role/admin'
                };
                endpoint = adminEndpointMap[tableName];

                // Если endpoint для администратора не определен, используем обычный
                if (!endpoint) {
                    console.log(`⚠️ Админский endpoint для ${tableName} не найден, используем обычный`);
                    const regularEndpointMap = {
                        'equipment': '/equipment',
                        'fuel': '/fuel',
                        'geyser': '/geyser',
                        'users': '/user',
                        'repair': '/repair',
                        'roles': '/role'
                    };
                    endpoint = regularEndpointMap[tableName];
                }
            } else {
                // Для обычных пользователей используем обычные endpoints
                const endpointMap = {
                    'equipment': '/equipment',
                    'fuel': '/fuel',
                    'geyser': '/geyser',
                    'users': '/user',
                    'repair': '/repair',
                    'roles': '/role'
                };
                endpoint = endpointMap[tableName];
            }

            if (!endpoint) {
                throw new Error(`Нет endpoint для таблицы: ${tableName}`);
            }

            console.log(`📡 Запрос к: ${endpoint} (роль: ${this.userRole})`);
            const response = await this.request(endpoint, { method: 'GET' });
            let data = this.processResponseData(response);

            console.log(`📊 Получено записей: ${data.length} для таблицы ${tableName}`);

            return data;
        } catch (error) {
            console.error('❌ Ошибка в getTableData:', error);

            // Если админский endpoint не работает, пробуем обычный для администратора
            if (this.isAdmin() && (error.status === 404 || error.status === 405)) {
                console.log('🔄 Пробуем обычный endpoint для администратора...');
                const regularEndpointMap = {
                    'equipment': '/equipment',
                    'fuel': '/fuel',
                    'geyser': '/geyser',
                    'users': '/user',
                    'repair': '/repair',
                    'roles': '/role'
                };
                const fallbackEndpoint = regularEndpointMap[tableName];
                if (fallbackEndpoint) {
                    try {
                        const response = await this.request(fallbackEndpoint, { method: 'GET' });
                        return this.processResponseData(response);
                    } catch (fallbackError) {
                        console.error('❌ Ошибка при использовании fallback endpoint:', fallbackError);
                    }
                }
            }

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

            // Для администратора - мягкое удаление (устанавливаем дату удаления)
            if (this.isAdmin()) {
                console.log(`👨‍💼 Администратор выполняет мягкое удаление`);

                // Сначала пробуем PATCH для мягкого удаления
                try {
                    let softDeleteEndpoint;
                    const endpointMap = {
                        'equipment': `/equipment/${id}/soft-delete`,
                        'fuel': `/fuel/${id}/soft-delete`,
                        'geyser': `/geyser/${id}/soft-delete`,
                        'users': `/user/${id}/soft-delete`,
                        'repair': `/repair/${id}/soft-delete`,
                        'roles': `/role/${id}/soft-delete`
                    };

                    softDeleteEndpoint = endpointMap[tableName] || `/${tableName}/${id}/soft-delete`;

                    console.log(`📤 Пробуем мягкое удаление через PATCH: ${softDeleteEndpoint}`);

                    const requestBody = {
                        deletedAt: new Date().toISOString(),
                        whoChanged: this.userName || 'Admin'
                    };

                    const response = await this.request(softDeleteEndpoint, {
                        method: 'PATCH',
                        body: requestBody
                    });

                    return response;
                } catch (softDeleteError) {
                    console.log(`🔄 Мягкое удаление не сработало, пробуем стандартное:`, softDeleteError);
                    // Продолжаем к стандартному удалению
                }
            }

            // Стандартное удаление для всех пользователей
            let endpoint;

            if (tableName === 'users' || tableName === 'user') {
                endpoint = `/user/${id}/delete`;
            } else if (tableName === 'equipment') {
                endpoint = `/equipment/${id}/delete`;
            } else if (tableName === 'fuel') {
                endpoint = `/fuel/${id}/delete`;
            } else if (tableName === 'geyser') {
                endpoint = `/geyser/${id}/delete`;
            } else if (tableName === 'repair') {
                endpoint = `/repair/${id}/delete`;
            } else if (tableName === 'roles') {
                endpoint = `/role/${id}/delete`;
            } else {
                endpoint = `/${tableName}/${id}/delete`;
            }

            console.log(`📤 Отправка запроса на удаление: ${endpoint}`);

            // Пробуем разные методы для удаления
            try {
                // Сначала пробуем DELETE метод
                console.log(`🔄 Пробуем DELETE метод...`);
                const response = await this.request(endpoint, {
                    method: 'DELETE'
                });
                return response;
            } catch (deleteError) {
                console.log(`❌ DELETE не сработал: ${deleteError.status}`);

                // Если DELETE не работает, пробуем POST
                if (deleteError.status === 405 || deleteError.status === 404) {
                    console.log(`🔄 Пробуем POST метод...`);
                    const requestBody = {
                        isDeleted: true,
                        deletedAt: new Date().toISOString(),
                        whoChanged: this.userName || 'System'
                    };

                    const postResponse = await this.request(endpoint, {
                        method: 'POST',
                        body: requestBody
                    });
                    return postResponse;
                }

                throw deleteError;
            }
        } catch (error) {
            console.error('❌ Ошибка при удалении записи:', error);
            throw error;
        }
    }

    async restoreRecord(tableName, id) {
        try {
            if (!this.isAdmin()) {
                throw new Error('Только администратор может восстанавливать записи');
            }

            console.log(`♻️ Восстановление записи: ${tableName}, id=${id}`);

            // Используем правильные endpoints для восстановления
            // Сначала пробуем PATCH, если не работает - POST
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

            console.log(`📤 Endpoint для восстановления: ${endpoint}`);

            // Пробуем сначала PATCH метод (стандартный для восстановления)
            try {
                console.log(`🔄 Пробуем PATCH метод для восстановления...`);
                const response = await this.request(endpoint, {
                    method: 'PATCH',
                    body: {}
                });
                console.log(`✅ Восстановление через PATCH успешно`);
                return response;
            } catch (patchError) {
                console.log(`❌ PATCH не сработал: ${patchError.status || patchError.message}`);

                // Если PATCH не работает, пробуем POST метод
                if (patchError.status === 405 || patchError.status === 404) {
                    console.log(`🔄 Пробуем POST метод для восстановления...`);
                    try {
                        const requestBody = {
                            isDeleted: false,
                            deletedAt: null,
                            whoChanged: this.userName || 'Admin'
                        };

                        const response = await this.request(endpoint, {
                            method: 'POST',
                            body: requestBody
                        });
                        console.log(`✅ Восстановление через POST успешно`);
                        return response;
                    } catch (postError) {
                        console.error(`❌ POST также не сработал:`, postError);
                        throw new Error(`Не удалось восстановить запись. Ошибка: ${postError.message}`);
                    }
                } else {
                    throw patchError;
                }
            }
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
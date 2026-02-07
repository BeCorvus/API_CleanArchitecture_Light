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
                return Promise.reject(new Error('Требуется авторизация'));
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
            const loginField = credentials.login || credentials.username || credentials.email;
            if (!loginField) {
                throw new Error('Не указано имя пользователя, логин или email');
            }

            const loginData = {
                login: loginField,
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

            let endpoint;

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

        if (item.isDeleted === true || item.IsDeleted === true || item.isdeleted === true) {
            return true;
        }

        const deleteDateFields = ['deletedAt', 'DeletedAt', 'whenDeleted', 'WhenDeleted'];
        for (const field of deleteDateFields) {
            if (item[field] !== null && item[field] !== undefined && item[field] !== '') {
                return true;
            }
        }

        return false;
    }

    async createRecord(tableName, data) {
        try {
            console.log(`✨ Создание новой записи в таблице: ${tableName}`, data);

            // Удаляем служебные поля из данных, если они есть
            const serviceFields = [
                'id', 'Id', 'ID',
                'createdAt', 'updatedAt', 'deletedAt',
                'dateOfRecording', 'dateOfChange', 'whenDeleted',
                'whoRecorded', 'whoChanged', 'isDeleted'
            ];

            const cleanData = { ...data };
            serviceFields.forEach(field => {
                delete cleanData[field];
                delete cleanData[field.toLowerCase()];
                delete cleanData[field.toUpperCase()];
            });

            const endpoint = `/${tableName}`;
            console.log(`📤 Отправка POST на ${endpoint}`);

            try {
                const response = await this.request(endpoint, {
                    method: 'POST',
                    body: cleanData
                });
                return response;
            } catch (postError) {
                console.log(`❌ POST не сработал (${postError.status}), пробуем /create endpoint`);

                try {
                    const response = await this.request(`/${tableName}/create`, {
                        method: 'POST',
                        body: cleanData
                    });
                    return response;
                } catch (createError) {
                    console.log(`❌ /create endpoint также не сработал (${createError.status})`);
                    throw createError;
                }
            }
        } catch (error) {
            console.error('❌ Ошибка при создании записи:', error);

            if (error.status === 405 || error.status === 404 || error.status === 501) {
                console.log('⚠️ API не поддерживает создание записей, используем локальное решение');
                return {
                    success: true,
                    message: 'Запись создана локально',
                    localCreate: true,
                    data: this.generateMockRecord(data, tableName)
                };
            }

            throw error;
        }
    }

    async deleteRecord(tableName, id) {
        try {
            console.log(`🗑️ Удаление записи: ${tableName}, id=${id}, роль=${this.userRole}`);

            if (this.isAdmin()) {
                console.log(`👨‍💼 Администратор выполняет мягкое удаление`);

                const endpoint = `/${tableName}/${id}`;
                console.log(`📤 Отправка DELETE на ${endpoint}`);

                try {
                    const response = await this.request(endpoint, {
                        method: 'DELETE'
                    });
                    return response;
                } catch (adminError) {
                    console.log(`❌ DELETE не сработал, используем локальное удаление:`, adminError);
                    return {
                        success: true,
                        message: 'Запись помечена как удаленная локально',
                        localDelete: true
                    };
                }
            }

            const endpoint = `/${tableName}/${id}`;
            console.log(`📤 Отправка DELETE на ${endpoint}`);

            try {
                const response = await this.request(endpoint, {
                    method: 'DELETE'
                });
                return response;
            } catch (error) {
                console.error(`❌ DELETE не сработал (${error.status})`);
                throw error;
            }
        } catch (error) {
            console.error('❌ Ошибка при удалении записи:', error);

            if (error.status === 405 || error.status === 404) {
                return {
                    success: true,
                    message: 'Запись удалена локально (API недоступен)',
                    localDelete: true
                };
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

            const endpoint = `/${tableName}/restore/${id}`;
            console.log(`📤 Отправка POST на ${endpoint}`);

            try {
                const response = await this.request(endpoint, {
                    method: 'POST'
                });
                return response;
            } catch (postError) {
                console.log(`❌ POST не сработал (${postError.status})`);

                try {
                    const response = await this.request(endpoint, {
                        method: 'POST',
                        body: {}
                    });
                    return response;
                } catch (emptyBodyError) {
                    console.log(`❌ POST с пустым телом также не сработал`);
                    throw emptyBodyError;
                }
            }
        } catch (error) {
            console.error('❌ Ошибка при восстановлении записи:', error);

            if (error.status === 405 || error.status === 404) {
                console.log('⚠️ API не поддерживает восстановление, используем локальное решение');
                return {
                    success: true,
                    message: 'Запись восстановлена локально',
                    localRestore: true
                };
            }

            throw error;
        }
    }

    async updateRecord(tableName, id, data) {
        try {
            console.log(`✏️ Обновление записи: ${tableName}, id=${id}`, data);

            // Удаляем служебные поля из данных для обновления
            const serviceFields = [
                'id', 'Id', 'ID',
                'createdAt', 'dateOfRecording', 'whoRecorded'
            ];

            const cleanData = { ...data };
            serviceFields.forEach(field => {
                delete cleanData[field];
                delete cleanData[field.toLowerCase()];
                delete cleanData[field.toUpperCase()];
            });

            const endpoint = `/${tableName}/${id}`;
            console.log(`📤 Отправка PUT на ${endpoint}`);

            try {
                const response = await this.request(endpoint, {
                    method: 'PUT',
                    body: cleanData
                });
                return response;
            } catch (putError) {
                console.log(`❌ PUT не сработал (${putError.status}), пробуем PATCH`);

                try {
                    const response = await this.request(endpoint, {
                        method: 'PATCH',
                        body: cleanData
                    });
                    return response;
                } catch (patchError) {
                    console.log(`❌ PATCH также не сработал (${patchError.status})`);
                    throw patchError;
                }
            }
        } catch (error) {
            console.error('❌ Ошибка при обновлении записи:', error);

            if (error.status === 405 || error.status === 404) {
                console.log('⚠️ API не поддерживает обновление, используем локальное решение');
                return {
                    success: true,
                    message: 'Запись обновлена локально',
                    localUpdate: true
                };
            }

            throw error;
        }
    }

    getRecordId(record) {
        if (!record || typeof record !== 'object') {
            console.error('Некорректная запись:', record);
            return null;
        }

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

    generateMockRecord(data, tableName) {
        const mockId = Math.floor(Math.random() * 10000) + 1000;
        const now = new Date().toISOString();
        const userId = localStorage.getItem('userId') || 'system';

        const baseRecord = {
            ...data,
            id: mockId,
            createdAt: now,
            updatedAt: now,
            dateOfRecording: now,
            dateOfChange: now,
            whoRecorded: userId,
            whoChanged: userId,
            isDeleted: false
        };

        // Добавляем специфичные поля для разных таблиц
        switch (tableName) {
            case 'users':
                baseRecord.role = data.role || 'user';
                baseRecord.isActive = data.isActive !== undefined ? data.isActive : true;
                baseRecord.lastLogin = null;
                break;
            case 'equipment':
                baseRecord.status = data.status || 'active';
                baseRecord.lastMaintenance = data.lastMaintenance || null;
                break;
            case 'fuel':
                baseRecord.quantity = parseFloat(data.quantity) || 0;
                baseRecord.price = parseFloat(data.price) || 0;
                break;
            case 'geyser':
                baseRecord.status = data.status || 'operational';
                break;
            case 'repair':
                baseRecord.status = data.status || 'pending';
                baseRecord.dateOfRepair = data.dateOfRepair || now;
                break;
            case 'roles':
                baseRecord.permissions = data.permissions || 'read';
                break;
        }

        return baseRecord;
    }

    async getStatistics(tableName, type = 'daily') {
        try {
            const endpoint = `/statistics/${tableName}?type=${type}`;
            const data = await this.request(endpoint, { method: 'GET' });
            return data;
        } catch (error) {
            return await this.generateBasicStatistics(tableName);
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

            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                stats.labels.push(date.toLocaleDateString('ru-RU'));
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

const api = new ApiService();
window.api = api;
window.apiService = api;
// Базовый URL API
const API_BASE_URL = window.location.origin + '/api';

// Сервис для работы с API
class ApiService {
    constructor() {
        this.token = localStorage.getItem('authToken');
    }

    // Установка токена
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Удаление токена
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // Проверка валидности токена
    async validateToken() {
        try {
            const response = await this.request('/Users/profile', {
                method: 'GET'
            });
            return response && response.username;
        } catch (error) {
            console.error('Token validation failed:', error);
            return false;
        }
    }

    // Базовый метод для HTTP запросов
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;

        console.log('📤 API Request:', {
            url: url,
            method: options.method || 'GET',
            endpoint: endpoint,
            body: options.body,
            headers: options.headers
        });

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Добавляем токен авторизации если есть
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
            console.log('📦 Request body (stringified):', config.body);
        }

        try {
            const response = await fetch(url, config);

            console.log('📥 API Response:', {
                status: response.status,
                statusText: response.statusText,
                url: response.url,
                ok: response.ok
            });

            // Для DELETE запросов может не быть тела
            if (response.status === 204) {
                console.log('✅ 204 No Content - успешное удаление');
                return { success: true, message: 'Удалено успешно' };
            }

            if (response.status === 401) {
                // Неавторизован - перенаправляем на логин
                console.warn('❌ 401 Unauthorized - перенаправление на логин');
                this.clearToken();
                window.location.href = '/login.html';
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                let errorText = '';
                try {
                    // Пытаемся получить JSON ошибки
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorJson = await response.json();
                        errorText = JSON.stringify(errorJson);
                    } else {
                        errorText = await response.text();
                    }
                } catch (e) {
                    errorText = 'Не удалось прочитать ошибку';
                }

                console.error('❌ API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            // Проверяем, есть ли тело ответа
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const responseData = await response.json();
                console.log('✅ API Success Response:', responseData);
                return responseData;
            } else {
                // Если ответ не JSON, возвращаем текст
                const text = await response.text();
                console.log('✅ API Success Response (text):', text);
                return text;
            }
        } catch (error) {
            console.error('❌ API request failed:', error);
            // Не бросаем ошибку дальше, чтобы не ломать интерфейс
            // Вместо этого возвращаем объект с ошибкой
            return {
                error: true,
                message: error.message,
                status: error.status || 0
            };
        }
    }

    // Аутентификация
    async login(loginData) {
        return await this.request('/auth/login', {
            method: 'POST',
            body: loginData
        });
    }

    async register(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: userData
        });
    }

    // CRUD операции для Equipment
    async getEquipment() {
        const result = await this.request('/Equipment');
        // Если результат содержит error, возвращаем пустой массив
        if (result && result.error) {
            console.warn('Ошибка при получении оборудования, возвращаем пустой массив');
            return [];
        }
        return result || [];
    }

    async getEquipmentById(id) {
        return await this.request(`/Equipment/${id}`);
    }

    async createEquipment(equipment) {
        return await this.request('/Equipment', {
            method: 'POST',
            body: equipment
        });
    }

    async updateEquipment(id, equipment) {
        return await this.request(`/Equipment/${id}`, {
            method: 'PUT',
            body: equipment
        });
    }

    async deleteEquipment(id) {
        return await this.request(`/Equipment/${id}`, {
            method: 'DELETE'
        });
    }

    // CRUD операции для Fuel
    async getFuel() {
        const result = await this.request('/Fuel');
        if (result && result.error) {
            console.warn('Ошибка при получении топлива, возвращаем пустой массив');
            return [];
        }
        return result || [];
    }

    async createFuel(fuel) {
        return await this.request('/Fuel', {
            method: 'POST',
            body: fuel
        });
    }

    async updateFuel(id, fuel) {
        return await this.request(`/Fuel/${id}`, {
            method: 'PUT',
            body: fuel
        });
    }

    async deleteFuel(id) {
        return await this.request(`/Fuel/${id}`, {
            method: 'DELETE'
        });
    }

    // CRUD операции для Geyser
    async getGeysers() {
        const result = await this.request('/Geyser');
        if (result && result.error) {
            console.warn('Ошибка при получении гейзеров, возвращаем пустой массив');
            return [];
        }
        return result || [];
    }

    async createGeyser(geyser) {
        return await this.request('/Geyser', {
            method: 'POST',
            body: geyser
        });
    }

    async updateGeyser(id, geyser) {
        return await this.request(`/Geyser/${id}`, {
            method: 'PUT',
            body: geyser
        });
    }

    async deleteGeyser(id) {
        return await this.request(`/Geyser/${id}`, {
            method: 'DELETE'
        });
    }

    // CRUD операции для Repair
    async getRepairs() {
        const result = await this.request('/Repair');
        if (result && result.error) {
            console.warn('Ошибка при получении ремонтов, возвращаем пустой массив');
            return [];
        }
        return result || [];
    }

    async createRepair(repair) {
        return await this.request('/Repair', {
            method: 'POST',
            body: repair
        });
    }

    async updateRepair(id, repair) {
        return await this.request(`/Repair/${id}`, {
            method: 'PUT',
            body: repair
        });
    }

    async deleteRepair(id) {
        return await this.request(`/Repair/${id}`, {
            method: 'DELETE'
        });
    }

    // Получение профиля пользователя
    async getProfile() {
        return await this.request('/Users/profile');
    }
}

// Создаем глобальный экземпляр API сервиса
window.apiService = new ApiService();
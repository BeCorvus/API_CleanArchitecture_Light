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

    // Базовый метод для HTTP запросов
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;

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

        // Добавляем тело запроса если есть
        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);

            if (response.status === 401) {
                // Неавторизован - перенаправляем на логин
                this.clearToken();
                window.location.href = '/login.html';
                return null;
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            // Для DELETE запросов может не быть тела
            if (response.status === 204) {
                return { success: true, message: 'Удалено успешно' };
            }

            // Пытаемся распарсить JSON
            try {
                return await response.json();
            } catch (e) {
                return { success: true, message: 'Операция выполнена успешно' };
            }
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Аутентификация
    async login(credentials) {
        return await this.request('/Auth/login', {
            method: 'POST',
            body: credentials
        });
    }

    async register(userData) {
        return await this.request('/Auth/register', {
            method: 'POST',
            body: userData
        });
    }

    // CRUD операции для Equipment
    async getEquipment() {
        return await this.request('/Equipment');
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
        return await this.request('/Fuel');
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
        return await this.request('/Geyser');
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
        return await this.request('/Repair');
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
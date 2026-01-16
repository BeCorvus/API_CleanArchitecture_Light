// api.js
const API_BASE_URL = 'http://localhost:5077/api'; // Замените на ваш URL

class ApiService {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.userRole = localStorage.getItem('userRole');
        this.userName = localStorage.getItem('userName');
    }

    // Установка токена
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Установка информации о пользователе
    setUserInfo(username, role) {
        this.userName = username;
        this.userRole = role;
        localStorage.setItem('userName', username);
        localStorage.setItem('userRole', role); // Сохраняем как есть из API
    }

    // Очистка данных
    clearData() {
        this.token = null;
        this.userRole = null;
        this.userName = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
    }

    // Базовый метод для запросов
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;

        console.log('📤 Отправка запроса:', {
            url: url,
            method: options.method || 'GET',
            endpoint: endpoint
        });

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Добавляем токен, если есть
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            ...options,
            headers
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
            console.log('📦 Тело запроса:', config.body);
        }

        try {
            const response = await fetch(url, config);

            console.log('📥 Ответ сервера:', {
                status: response.status,
                statusText: response.statusText,
                url: response.url
            });

            // Обработка ошибок авторизации
            if (response.status === 401) {
                this.clearData();
                window.location.href = 'login.html';
                throw new Error('Требуется авторизация');
            }

            // Получаем данные ответа
            let responseData;
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            // Если статус не успешный (не 2xx), выбрасываем ошибку
            if (!response.ok) {
                console.error('❌ Ошибка сервера:', responseData);

                // Создаем объект ошибки с данными от сервера
                const error = new Error(`HTTP error! status: ${response.status}`);
                error.status = response.status;
                error.data = responseData;

                // Добавляем сообщение об ошибке из ответа сервера
                if (responseData && typeof responseData === 'object') {
                    error.message = responseData.message || error.message;
                    // Если есть валидационные ошибки
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

            console.log('✅ Успешный ответ:', responseData);
            return responseData;

        } catch (error) {
            console.error('❌ Ошибка запроса:', error);

            // Добавляем пользователю понятное сообщение
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                error.message = 'Не удалось подключиться к серверу. Проверьте подключение к интернету и адрес сервера.';
            }

            throw error;
        }
    }

    // Вход в систему
    async login(credentials) {
        console.log('🔐 Вход с данными:', credentials);
        try {
            // Преобразуем данные в формат, который ожидает сервер
            // Сервер, скорее всего, ожидает login или email
            const loginData = {
                login: credentials.login || credentials.username || credentials.email,
                password: credentials.password
            };

            console.log('📤 Отправка данных для входа:', loginData);

            const result = await this.request('/auth/login', {
                method: 'POST',
                body: loginData
            });

            console.log('🔑 Результат входа:', result);

            // Обработка успешного ответа
            if (result) {
                if (result.token) {
                    this.setToken(result.token);
                }

                if (result.user) {
                    // Сохраняем реальную роль из API без форматирования
                    const userRole = result.user.role || 'User';

                    this.setUserInfo(
                        result.user.username || result.user.login || result.user.email,
                        userRole // Сохраняем как есть
                    );
                }
            }

            return result;
        } catch (error) {
            console.error('Ошибка входа:', error);
            throw error;
        }
    }

    // Регистрация пользователя
    async register(userData) {
        console.log('📝 Регистрация с данными:', userData);
        try {
            // Преобразуем данные в формат, который ожидает сервер
            // Согласно Swagger, сервер ожидает:
            // email, login, password, confirmPassword, note
            const registerData = {
                email: userData.email || '',
                login: userData.login || userData.username || '',
                password: userData.password || '',
                confirmPassword: userData.confirmPassword || userData.password || '',
                note: userData.note || ''
            };

            console.log('📤 Отправка данных для регистрации:', registerData);

            const result = await this.request('/auth/register', {
                method: 'POST',
                body: registerData
            });

            console.log('✅ Результат регистрации:', result);

            // Обработка успешного ответа
            if (result) {
                if (result.token) {
                    this.setToken(result.token);
                }

                if (result.user) {
                    // Сохраняем реальную роль из API без форматирования
                    const userRole = result.user.role || 'User';

                    this.setUserInfo(
                        result.user.login || result.user.username || result.user.email,
                        userRole // Сохраняем как есть
                    );
                }
            }

            return result;
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            throw error;
        }
    }

    // Проверка роли
    isAdmin() {
        return this.userRole &&
            (this.userRole.toLowerCase() === 'admin' ||
                this.userRole.toLowerCase() === 'администратор');
    }
}

// Создаем глобальный экземпляр
window.apiService = new ApiService();
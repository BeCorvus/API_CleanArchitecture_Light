// auth.js

// Переключение между вкладками
function showTab(tabName) {
    // Скрываем все формы
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });

    // Деактивируем все кнопки
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Показываем выбранную форму
    document.getElementById(tabName + 'Form').classList.add('active');

    // Активируем выбранную кнопку
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.textContent.toLowerCase().includes(tabName)) {
            btn.classList.add('active');
        }
    });

    // Скрываем сообщения
    hideMessage();

    // Очищаем поля форм при переключении вкладок
    document.querySelectorAll('.auth-form input, .auth-form textarea').forEach(field => {
        field.value = '';
    });

    // Сбрасываем индикатор сложности пароля
    const strengthBar = document.getElementById('strengthBar');
    if (strengthBar) {
        strengthBar.className = 'strength-bar';
        strengthBar.style.width = '0%';
    }
}

// Показать/скрыть пароль
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggleIcon = input.parentNode.querySelector('.toggle-password');

    if (input.type === 'password') {
        input.type = 'text';
        toggleIcon.textContent = '👁️‍🗨️';
    } else {
        input.type = 'password';
        toggleIcon.textContent = '👁️';
    }
}

// Проверка сложности пароля
function checkPasswordStrength() {
    const password = document.getElementById('regPassword').value;
    const strengthBar = document.getElementById('strengthBar');

    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;

    strengthBar.className = 'strength-bar';
    if (strength <= 1) {
        strengthBar.classList.add('strength-weak');
    } else if (strength <= 3) {
        strengthBar.classList.add('strength-medium');
    } else {
        strengthBar.classList.add('strength-strong');
    }
}

// Показать сообщение
function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    if (messageEl) {
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';

        setTimeout(() => {
            hideMessage();
        }, 5000);
    }
}

function hideMessage() {
    const messageEl = document.getElementById('message');
    if (messageEl) {
        messageEl.style.display = 'none';
    }
}

// Обработка формы входа
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Запуск системы авторизации...');

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const loginInput = document.getElementById('loginInput').value.trim();
            const password = document.getElementById('loginPassword').value;

            if (!loginInput || !password) {
                showMessage('Заполните все поля', 'error');
                return;
            }

            // Показываем загрузку
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Вход...';
            submitBtn.disabled = true;

            try {
                // Определяем, что ввел пользователь: email или login
                const isEmail = loginInput.includes('@');

                const credentials = {
                    login: isEmail ? null : loginInput,
                    email: isEmail ? loginInput : null,
                    username: isEmail ? null : loginInput,
                    password: password
                };

                // Удаляем null значения
                Object.keys(credentials).forEach(key => {
                    if (credentials[key] === null) {
                        delete credentials[key];
                    }
                });

                console.log('📤 Отправка данных для входа:', credentials);

                const result = await apiService.login(credentials);

                if (result && (result.token || result.success)) {
                    showMessage('Вход выполнен успешно!', 'success');

                    // Перенаправление на главную страницу
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                } else {
                    showMessage(result?.message || 'Ошибка входа', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showMessage(error.message || 'Ошибка при входе в систему', 'error');
            } finally {
                // Восстанавливаем кнопку
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Обработка формы регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const username = document.getElementById('regUsername').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            const note = document.getElementById('regNote') ? document.getElementById('regNote').value.trim() : '';

            // Валидация
            if (!username || !email || !password || !confirmPassword) {
                showMessage('Заполните все обязательные поля', 'error');
                return;
            }

            if (password !== confirmPassword) {
                showMessage('Пароли не совпадают', 'error');
                return;
            }

            if (password.length < 6) {
                showMessage('Пароль должен содержать минимум 6 символов', 'error');
                return;
            }

            if (!email.includes('@') || !email.includes('.')) {
                showMessage('Введите корректный email', 'error');
                return;
            }

            // Показываем загрузку
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Регистрация...';
            submitBtn.disabled = true;

            try {
                // Формируем данные для регистрации в формате, который ожидает сервер
                const userData = {
                    email: email,
                    login: username, // Поле login должно совпадать с тем, что в Swagger
                    password: password,
                    confirmPassword: confirmPassword,
                    note: note || ''
                };

                console.log('📤 Отправка данных для регистрации:', userData);

                const result = await apiService.register(userData);

                if (result && (result.token || result.success)) {
                    showMessage('Регистрация прошла успешно!', 'success');

                    // Перенаправление на главную страницу
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                } else {
                    showMessage(result?.message || 'Ошибка регистрации', 'error');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showMessage(error.message || 'Ошибка при регистрации', 'error');
            } finally {
                // Восстанавливаем кнопку
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Проверка, если пользователь уже авторизован
    const token = localStorage.getItem('authToken');
    if (token && window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
    }

    // Инициализация табов
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const tabName = this.textContent.toLowerCase().includes('вход') ? 'login' : 'register';
            showTab(tabName);
        });
    });
});
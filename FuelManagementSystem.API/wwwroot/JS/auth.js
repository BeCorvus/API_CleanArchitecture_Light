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
        if (!field.getAttribute('data-keep')) {
            field.value = '';
        }
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

    if (!strengthBar) return;

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

        // Автоматически скрываем через 5 секунд
        setTimeout(() => {
            hideMessage();
        }, 5000);
    }

    // Также показываем уведомление
    showNotification(text, type);
}

// Показать уведомление
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#f8d7da' : type === 'success' ? '#d4edda' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
        color: ${type === 'error' ? '#721c24' : type === 'success' ? '#155724' : type === 'warning' ? '#856404' : '#0c5460'};
        border: 1px solid ${type === 'error' ? '#f5c6cb' : type === 'success' ? '#c3e6cb' : type === 'warning' ? '#ffeaa7' : '#bee5eb'};
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
        font-family: 'Segoe UI', sans-serif;
        font-size: 14px;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function hideMessage() {
    const messageEl = document.getElementById('message');
    if (messageEl) {
        messageEl.style.display = 'none';
    }
}

// Проверка, авторизован ли пользователь
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const currentPage = window.location.pathname;

    // Если на странице авторизации и уже есть токен - перенаправляем
    if (currentPage.includes('login.html') && token) {
        console.log('✅ Пользователь уже авторизован, перенаправление на главную');
        window.location.href = 'index.html';
    }

    // Если на главной и нет токена - перенаправляем на логин
    if ((currentPage.includes('index.html') || currentPage.includes('statistics.html')) && !token) {
        console.log('❌ Пользователь не авторизован, перенаправление на логин');
        window.location.href = 'login.html';
    }
}

// Обработка формы входа
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Запуск системы авторизации...');
    console.log('🔍 Проверка авторизации...');

    // Проверяем авторизацию
    checkAuth();

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
                    password: password
                };

                // Удаляем null значения
                Object.keys(credentials).forEach(key => {
                    if (credentials[key] === null) {
                        delete credentials[key];
                    }
                });

                console.log('📤 Отправка данных для входа:', credentials);

                // Используем apiService для входа
                const result = await apiService.login(credentials);

                console.log('✅ Результат входа:', result);

                if (result && (result.token || result.success)) {
                    // Проверяем, сохранилась ли роль
                    const savedRole = localStorage.getItem('userRole');
                    const savedName = localStorage.getItem('userName');

                    console.log('💾 Проверка сохраненных данных:');
                    console.log('👤 Имя:', savedName);
                    console.log('🎭 Роль:', savedRole);
                    console.log('🔐 Токен:', localStorage.getItem('authToken'));

                    if (result.user) {
                        // Сохраняем отладочные данные
                        localStorage.setItem('userDebug', JSON.stringify(result.user));
                        console.log('🔍 Отладочные данные сохранены:', result.user);
                    }

                    showMessage('Вход выполнен успешно! Перенаправление...', 'success');

                    // Даем время для сохранения данных и показа сообщения
                    setTimeout(() => {
                        console.log('🔄 Перенаправление на главную страницу...');
                        window.location.href = 'index.html';
                    }, 1500);
                } else {
                    showMessage(result?.message || 'Ошибка входа', 'error');
                }
            } catch (error) {
                console.error('❌ Ошибка входа:', error);

                let errorMessage = 'Ошибка при входе в систему';
                if (error.message.includes('Failed to fetch')) {
                    errorMessage = 'Не удалось подключиться к серверу. Проверьте подключение к интернету.';
                } else if (error.message) {
                    errorMessage = error.message;
                }

                showMessage(errorMessage, 'error');
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
                // Формируем данные для регистрации
                const userData = {
                    email: email,
                    login: username,
                    password: password,
                    confirmPassword: confirmPassword,
                    note: note || ''
                };

                console.log('📤 Отправка данных для регистрации:', userData);

                // Используем apiService для регистрации
                const result = await apiService.register(userData);

                console.log('✅ Результат регистрации:', result);

                if (result && (result.token || result.success)) {
                    // Проверяем, сохранилась ли роль
                    const savedRole = localStorage.getItem('userRole');
                    const savedName = localStorage.getItem('userName');

                    console.log('💾 Проверка сохраненных данных:');
                    console.log('👤 Имя:', savedName);
                    console.log('🎭 Роль:', savedRole);

                    if (result.user) {
                        // Сохраняем отладочные данные
                        localStorage.setItem('userDebug', JSON.stringify(result.user));
                        console.log('🔍 Отладочные данные сохранены:', result.user);
                    }

                    showMessage('Регистрация прошла успешно! Перенаправление...', 'success');

                    // Даем время для сохранения данных и показа сообщения
                    setTimeout(() => {
                        console.log('🔄 Перенаправление на главную страницу...');
                        window.location.href = 'index.html';
                    }, 1500);
                } else {
                    showMessage(result?.message || 'Ошибка регистрации', 'error');
                }
            } catch (error) {
                console.error('❌ Ошибка регистрации:', error);

                let errorMessage = 'Ошибка при регистрации';
                if (error.message.includes('Failed to fetch')) {
                    errorMessage = 'Не удалось подключиться к серверу. Проверьте подключение к интернету.';
                } else if (error.message) {
                    errorMessage = error.message;
                }

                showMessage(errorMessage, 'error');
            } finally {
                // Восстанавливаем кнопку
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Инициализация табов
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const tabName = this.textContent.toLowerCase().includes('вход') ? 'login' : 'register';
            showTab(tabName);
        });
    });

    // Инициализация переключения пароля
    document.querySelectorAll('.toggle-password').forEach(icon => {
        const onclickAttr = icon.getAttribute('onclick');
        if (onclickAttr) {
            const inputId = onclickAttr.match(/'([^']+)'/)[1];
            icon.addEventListener('click', () => togglePassword(inputId));
        }
    });

    // Инициализация проверки сложности пароля
    const regPasswordInput = document.getElementById('regPassword');
    if (regPasswordInput) {
        regPasswordInput.addEventListener('input', checkPasswordStrength);
    }

    console.log('✅ Авторизация инициализирована');
});

// Экспорт функций для использования в HTML
window.showTab = showTab;
window.togglePassword = togglePassword;
window.checkPasswordStrength = checkPasswordStrength;
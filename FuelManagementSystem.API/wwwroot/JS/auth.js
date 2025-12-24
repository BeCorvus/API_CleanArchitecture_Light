// Функции аутентификации
function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    if (messageEl) {
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';

        setTimeout(() => {
            hideMessage();
        }, 5000);
    } else {
        alert(`${type.toUpperCase()}: ${text}`);
    }
}

function hideMessage() {
    const messageEl = document.getElementById('message');
    if (messageEl) {
        messageEl.style.display = 'none';
    }
}

// Обработка формы входа
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const loginInput = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    console.log('Login attempt:', {
        loginInput: loginInput,
        passwordLength: password.length
    });

    if (loginInput && password) {
        try {

            const loginData = {
                Login: loginInput,
                Password: password
            };

            console.log('Отправляемые данные для входа:', loginData);
            console.log('JSON строкой:', JSON.stringify(loginData));

            const result = await apiService.login(loginData);

            console.log('Результат входа:', result);

            if (result && result.token) {
                apiService.setToken(result.token);
                showMessage('Вход выполнен успешно!', 'success');

                // Перенаправляем на главную страницу
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                showMessage('Ошибка входа: неверные учетные данные', 'error');
            }
        } catch (error) {
            showMessage('Ошибка при входе в систему: ' + error.message, 'error');
            console.error('Login error:', error);
        }
    } else {
        showMessage('Пожалуйста, заполните все поля', 'error');
    }
});

// Обработка формы регистрации
document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    if (!username || !email || !password || !confirmPassword) {
        showMessage('Пожалуйста, заполните все поля', 'error');
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

    try {
        const result = await apiService.register({
            Email: email,
            Login: username,
            Password: password,
            ConfirmPassword: confirmPassword,
            Note: ""
        });

        console.log('Результат регистрации:', result); // Для отладки

        if (result && result.token) {
            apiService.setToken(result.token);
            showMessage('Регистрация прошла успешно!', 'success');

            // Перенаправляем на главную страницу
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showMessage('Ошибка регистрации', 'error');
        }
    } catch (error) {
        showMessage('Ошибка при регистрации: ' + error.message, 'error');
        console.error('Registration error:', error);
    }
});

// Обработка формы восстановления пароля
document.getElementById('forgotForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;

    if (!email) {
        showMessage('Пожалуйста, введите ваш email', 'error');
        return;
    }

    try {
        // Вызов API для восстановления пароля
        const result = await apiService.request('/auth/forgot-password', {
            method: 'POST',
            body: { Email: email }
        });

        showMessage('Инструкции по восстановлению пароля отправлены на ваш email', 'success');

        // Очистка формы и переход к входу
        setTimeout(() => {
            this.reset();
            showTab('login');
        }, 2000);
    } catch (error) {
        showMessage('Ошибка при восстановлении пароля: ' + error.message, 'error');
    }
});
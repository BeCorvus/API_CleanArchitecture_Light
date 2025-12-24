// Переключение между формами
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
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Скрываем сообщения
    hideMessage();
}

// Обработчики для кнопок переключения
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        showTab(btn.getAttribute('data-tab'));
    });
});

// Функция для показа/скрытия пароля
function togglePassword(inputId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = passwordInput.parentNode.querySelector('.toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.textContent = '🔒';
    } else {
        passwordInput.type = 'password';
        toggleIcon.textContent = '👁️';
    }
}

// Проверка сложности пароля
function checkPasswordStrength() {
    const password = document.getElementById('regPassword').value;
    const strengthBar = document.getElementById('strengthBar');
    
    let strength = 0;
    
    if (password.length >= 6) strength++;
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

// Показ сообщений
function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
        hideMessage();
    }, 5000);
}

function hideMessage() {
    const messageEl = document.getElementById('message');
    messageEl.style.display = 'none';
}

// Обработка формы входа
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    // Имитация проверки (в реальном приложении здесь был бы запрос к серверу)
    if (username && password) {
        showMessage('Вход выполнен успешно!', 'success');
    } else {
        showMessage('Пожалуйста, заполните все поля', 'error');
    }
});

// Обработка формы регистрации
document.getElementById('registerForm').addEventListener('submit', function(e) {
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
    
    showMessage('Регистрация прошла успешно! Проверьте вашу почту для подтверждения.', 'success');
    
    // Очистка формы и переход к входу
    setTimeout(() => {
        this.reset();
        document.getElementById('strengthBar').className = 'strength-bar';
        showTab('login');
    }, 2000);
});

// Обработка формы восстановления пароля
document.getElementById('forgotForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    
    if (!email) {
        showMessage('Пожалуйста, введите ваш email', 'error');
        return;
    }
    
    showMessage('Инструкции по восстановлению пароля отправлены на ваш email', 'success');
    
    // Очистка формы и переход к входу
    setTimeout(() => {
        this.reset();
        showTab('login');
    }, 2000);
});
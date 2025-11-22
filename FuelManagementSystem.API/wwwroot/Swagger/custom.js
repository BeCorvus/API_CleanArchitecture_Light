// Кастомная логика для автоматического добавления "Bearer " к токену
(function () {
    // Функция для добавления Bearer префикса
    function addBearerPrefix() {
        const input = document.querySelector('input[placeholder*="token" i], input[type="password"], #authorization_value');
        if (input && input.value && !input.value.startsWith('Bearer ')) {
            input.value = 'Bearer ' + input.value;
        }
    }

    // Ждем полной загрузки страницы
    window.addEventListener('load', function () {
        // Обработчик для кнопки Authorize
        const authorizeBtn = document.querySelector('.btn.authorize');
        if (authorizeBtn) {
            authorizeBtn.addEventListener('click', function () {
                // Даем время на открытие модального окна
                setTimeout(function () {
                    // Находим кнопку Authorize в модальном окне
                    const modalAuthorizeBtn = document.querySelector('.auth-btn-wrapper .btn.authorize');
                    if (modalAuthorizeBtn) {
                        // Добавляем обработчик на клик
                        modalAuthorizeBtn.addEventListener('click', addBearerPrefix);
                    }

                    // Также добавляем обработчик на нажатие Enter
                    const tokenInput = document.querySelector('input[type="password"], #authorization_value');
                    if (tokenInput) {
                        tokenInput.addEventListener('keypress', function (e) {
                            if (e.key === 'Enter') {
                                addBearerPrefix();
                            }
                        });
                    }
                }, 300);
            });
        }
    });

    // Альтернативный подход - перехват всех запросов
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
        // Проверяем, есть ли заголовок Authorization
        if (args[1] && args[1].headers) {
            const headers = new Headers(args[1].headers);
            const authHeader = headers.get('Authorization');
            if (authHeader && !authHeader.startsWith('Bearer ')) {
                headers.set('Authorization', 'Bearer ' + authHeader);
                args[1].headers = headers;
            }
        }
        return originalFetch.apply(this, args);
    };
})();
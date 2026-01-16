// dashboard.js
// Глобальные переменные
let currentTable = '';
let currentData = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Инициализация панели управления...');
    checkAuth();
    setupEventListeners();
    initDashboard();
});

// Инициализация дашборда
function initDashboard() {
    console.log('✅ Дашборд инициализирован');
    // Очищаем таблицу при инициализации
    clearTable();
}

// Проверка авторизации
async function checkAuth() {
    const token = localStorage.getItem('authToken');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Обновляем информацию о пользователе
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');

    if (userName) {
        document.getElementById('userName').textContent = userName;
    }

    if (userRole) {
        document.getElementById('userRole').textContent = userRole;

        // Скрываем кнопку статистики для не-админов
        if (userRole !== 'Admin' && userRole !== 'admin') {
            const statsBtn = document.getElementById('statisticsBtn');
            if (statsBtn) {
                statsBtn.style.display = 'none';
            }
        }
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка выхода
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Закрытие модального окна
    window.addEventListener('click', function (event) {
        const modal = document.getElementById('detailsModal');
        if (event.target == modal) {
            closeModal();
        }
    });
}

// Выход из системы
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        apiService.clearData();
        window.location.href = 'login.html';
    }
}

// Переход на страницу статистики
function showStatisticsPage() {
    window.location.href = 'statistics.html';
}

// Обработка выбора таблицы
function onTableSelect() {
    const tableSelect = document.getElementById('tableSelect');
    const generateBtn = document.getElementById('generateBtn');

    if (tableSelect.value) {
        generateBtn.disabled = false;
        currentTable = tableSelect.value;
        // АВТОМАТИЧЕСКАЯ ЗАГРУЗКА ДАННЫХ ПРИ ВЫБОРЕ ТАБЛИЦЫ
        generateData();
    } else {
        generateBtn.disabled = true;
        currentTable = '';
        // Очищаем таблицу при сбросе выбора
        clearTable();
    }
}

// Обновление данных (синоним для generateData)
function refreshData() {
    if (currentTable) {
        generateData();
    } else {
        showNotification('Сначала выберите таблицу', 'warning');
    }
}

// Загрузка данных (вызывается автоматически при выборе и по кнопке)
async function generateData() {
    if (!currentTable) {
        showNotification('Выберите таблицу', 'error');
        return;
    }

    const loading = document.getElementById('loading');
    const noData = document.getElementById('noData');
    const tableContainer = document.getElementById('dataTableContainer');

    // Показываем загрузку
    loading.classList.add('active');
    noData.style.display = 'none';
    tableContainer.style.display = 'none';

    try {
        // Получаем данные
        currentData = await fetchTableData(currentTable);

        // Проверяем данные
        if (!currentData || currentData.length === 0) {
            noData.textContent = 'В таблице нет данных';
            noData.style.display = 'block';
            tableContainer.style.display = 'none';
            showNotification('Данные не найдены', 'info');
        } else {
            // Отображаем данные
            displayTableData(currentData);
            tableContainer.style.display = 'block';
            showNotification(`Загружено записей: ${currentData.length}`, 'success');
        }
    } catch (error) {
        console.error('Error generating data:', error);
        noData.textContent = 'Ошибка загрузки данных: ' + (error.message || 'Неизвестная ошибка');
        noData.style.display = 'block';
        showNotification('Ошибка при загрузке данных', 'error');
    } finally {
        loading.classList.remove('active');
    }
}

// Получение данных таблицы
async function fetchTableData(tableName) {
    try {
        // Определяем эндпоинты
        const endpoints = {
            equipment: '/equipment',
            fuel: '/fuel',
            geyser: '/geyser',
            users: '/user',
            repair: '/repair',
            roles: '/role'
        };

        const endpoint = endpoints[tableName];
        if (!endpoint) {
            console.warn(`Нет эндпоинта для таблицы: ${tableName}`);
            return [];
        }

        console.log(`Запрос к: ${endpoint}`);

        // Используем apiService для запроса
        const response = await apiService.request(endpoint);

        // Проверяем ответ
        if (!response) {
            throw new Error('Сервер не вернул данные');
        }

        // Если ответ не массив, преобразуем его
        let data = response;
        if (!Array.isArray(response)) {
            data = convertToArray(response);
        }

        return data;
    } catch (error) {
        console.error(`Ошибка загрузки ${tableName}:`, error);
        showNotification('Ошибка при загрузке данных с сервера', 'error');
        return [];
    }
}

// Преобразование ответа в массив
function convertToArray(response) {
    // Если ответ уже массив
    if (Array.isArray(response)) {
        return response;
    }

    // Если ответ - объект, проверяем, не содержит ли он массив
    if (response && typeof response === 'object') {
        // Ищем массив в стандартных свойствах
        const arrayProperties = ['data', 'items', 'results', 'records'];
        for (const prop of arrayProperties) {
            if (response[prop] && Array.isArray(response[prop])) {
                return response[prop];
            }
        }

        // Если объект содержит ID, оборачиваем в массив
        const idFields = ['id', 'Id', 'IdUsers', 'IdEquipment', 'IdFuel', 'IdGeyser', 'IdRepair', 'IdRoles'];
        for (const field of idFields) {
            if (response[field] !== undefined) {
                return [response];
            }
        }
    }

    // В остальных случаях - пустой массив
    return [];
}

// Отображение данных в таблице
function displayTableData(data) {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');

    // Очищаем таблицу
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    if (!data || data.length === 0) {
        return;
    }

    // Создаем заголовки
    const firstItem = data[0];
    const headers = Object.keys(firstItem);

    // Исключаем технические поля
    const excludedFields = ['dateOfRecording', 'dateOfChange', 'whoRecorded',
        'whoChanged', 'whenDeleted', 'passwordHash',
        'resetToken', 'resetTokenExpiry'];
    const displayHeaders = headers.filter(header =>
        !excludedFields.includes(header.toLowerCase())
    );

    const headerRow = document.createElement('tr');

    displayHeaders.forEach(header => {
        const th = document.createElement('th');
        th.textContent = formatHeader(header);
        headerRow.appendChild(th);
    });

    // Добавляем столбец действий
    const actionsTh = document.createElement('th');
    actionsTh.textContent = 'Действия';
    headerRow.appendChild(actionsTh);

    tableHeader.appendChild(headerRow);

    // Заполняем таблицу
    data.forEach((row) => {
        const tableRow = document.createElement('tr');

        displayHeaders.forEach(header => {
            const td = document.createElement('td');
            let value = row[header];

            // Форматируем значение
            value = formatValue(value);

            td.textContent = value;
            tableRow.appendChild(td);
        });

        // Добавляем кнопки действий
        const actionsTd = document.createElement('td');
        actionsTd.className = 'actions-cell';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'action-btn view-btn';
        viewBtn.textContent = '👁️';
        viewBtn.title = 'Просмотреть подробности';
        viewBtn.onclick = () => viewDetails(row, displayHeaders);
        actionsTd.appendChild(viewBtn);

        tableRow.appendChild(actionsTd);
        tableBody.appendChild(tableRow);
    });
}

// Форматирование значения
function formatValue(value) {
    if (value === null || value === undefined) {
        return '-';
    }

    if (typeof value === 'boolean') {
        return value ? 'Да' : 'Нет';
    }

    if (typeof value === 'number') {
        // Форматируем валюту
        if (value.toString().includes('.') || value.toString().includes(',')) {
            return value.toFixed(2).replace('.', ',') + ' ₽';
        }
        return value.toLocaleString('ru-RU');
    }

    if (typeof value === 'string') {
        // Проверяем, является ли строка датой
        const dateRegex = /^\d{4}-\d{2}-\d{2}/;
        if (dateRegex.test(value)) {
            try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    return date.toLocaleDateString('ru-RU');
                }
            } catch (e) {
                // Не удалось распарсить как дату
            }
        }
        return value;
    }

    return String(value);
}

// Форматирование заголовка
function formatHeader(header) {
    const translations = {
        'id': 'ID',
        'idequipment': 'ID Оборудования',
        'idfuel': 'ID Топлива',
        'idgeyser': 'ID Колонки',
        'idrepair': 'ID Ремонта',
        'idroles': 'ID Роли',
        'idusers': 'ID Пользователя',
        'name': 'Название',
        'brand': 'Бренд',
        'type': 'Тип',
        'status': 'Статус',
        'location': 'Местоположение',
        'lastmaintenance': 'Последнее обслуживание',
        'quantity': 'Количество',
        'unit': 'Единица',
        'price': 'Цена',
        'supplier': 'Поставщик',
        'date': 'Дата',
        'fueltype': 'Тип топлива',
        'amount': 'Сумма',
        'operator': 'Оператор',
        'username': 'Имя пользователя',
        'email': 'Email',
        'role': 'Роль',
        'lastlogin': 'Последний вход',
        'note': 'Примечание',
        'shelflife': 'Срок годности',
        'manufacturer': 'Производитель',
        'cost': 'Стоимость',
        'yearofrelease': 'Год выпуска',
        'dateofrepair': 'Дата ремонта',
        'releasedate': 'Дата выпуска',
        'repairman': 'Ремонтник',
        'namerole': 'Название роли',
        'login': 'Логин',
        'permissions': 'Права доступа',
        'description': 'Описание',
        'createddate': 'Дата создания',
        'modifieddate': 'Дата изменения',
        'isactive': 'Активен'
    };

    const lowerHeader = header.toLowerCase();
    if (translations[lowerHeader]) {
        return translations[lowerHeader];
    }

    // Форматируем camelCase
    const words = header.replace(/([A-Z])/g, ' $1').trim().split(' ');
    return words.map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}

// Просмотр деталей
function viewDetails(data, displayHeaders = null) {
    const modal = document.getElementById('detailsModal');
    const modalContent = document.getElementById('modalContent');

    let html = '<h3>Подробная информация</h3>';
    html += '<div class="details-container">';

    const fieldsToShow = displayHeaders || Object.keys(data);

    fieldsToShow.forEach(key => {
        let value = data[key];
        value = formatValue(value);

        html += `
            <div class="detail-row">
                <span class="detail-label">${formatHeader(key)}:</span>
                <span class="detail-value">${value}</span>
            </div>
        `;
    });

    html += '</div>';

    modalContent.innerHTML = html;
    modal.style.display = 'flex';
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('detailsModal').style.display = 'none';
}

// Очистка таблицы
function clearTable() {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    const tableContainer = document.getElementById('dataTableContainer');
    const noData = document.getElementById('noData');

    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';
    tableContainer.style.display = 'none';
    noData.style.display = 'block';
}

// Показ уведомления
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Стили
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
    `;

    document.body.appendChild(notification);

    // Автоматическое скрытие
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Экспорт функций
window.showStatisticsPage = showStatisticsPage;
window.logout = logout;
window.onTableSelect = onTableSelect;
window.generateData = generateData;
window.refreshData = refreshData;
window.viewDetails = viewDetails;
window.closeModal = closeModal;
// dashboard.js
let currentTable = '';
let currentData = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Инициализация панели управления...');
    checkAuth();
    setupEventListeners();
    initDashboard();
});

function initDashboard() {
    console.log('✅ Дашборд инициализирован');
    clearTable();
}

async function checkAuth() {
    console.log('🔐 Проверка авторизации...');
    const token = localStorage.getItem('authToken');

    if (!token) {
        console.log('❌ Токен не найден, перенаправление на страницу входа');
        window.location.href = 'login.html';
        return;
    }

    // Получаем данные пользователя
    const userName = localStorage.getItem('userName');
    let userRole = localStorage.getItem('userRole');

    console.log('📋 Данные пользователя:');
    console.log('👤 Имя:', userName);
    console.log('🎭 Роль:', userRole);

    // Проверяем данные для отладки
    const userDebug = localStorage.getItem('userDebug');
    if (userDebug) {
        console.log('🔍 Отладочные данные пользователя:', JSON.parse(userDebug));
    }

    if (userName) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userName;
            console.log('✅ Имя пользователя установлено:', userName);
        }
    }

    if (userRole) {
        const userRoleElement = document.getElementById('userRole');
        if (userRoleElement) {
            userRoleElement.textContent = formatDisplayRole(userRole);
            console.log('✅ Роль пользователя установлена:', userRole);
        }

        // Управление видимостью кнопки статистики
        manageStatisticsButton();
    } else {
        console.warn('⚠️ Роль пользователя не найдена в localStorage');
    }
}

function formatDisplayRole(role) {
    if (!role) {
        console.warn('⚠️ Роль пустая при форматировании');
        return 'Пользователь';
    }

    console.log('🎨 Форматирование роли:', role);
    const roleLower = role.toString().toLowerCase().trim();

    if (roleLower.includes('admin') || roleLower.includes('админ')) {
        return 'Администратор';
    } else if (roleLower.includes('user') || roleLower.includes('пользователь')) {
        return 'Пользователь';
    } else if (roleLower.includes('operator') || roleLower.includes('оператор')) {
        return 'Оператор';
    } else if (roleLower.includes('manager') || roleLower.includes('менеджер')) {
        return 'Менеджер';
    } else if (roleLower.includes('tech') || roleLower.includes('техник')) {
        return 'Техник';
    }

    // Для неизвестных ролей - первая буква заглавная
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

function manageStatisticsButton() {
    const statsBtn = document.getElementById('statisticsBtn');
    if (!statsBtn) {
        console.error('❌ Кнопка статистики не найдена в DOM');
        return;
    }

    const isAdmin = apiService.isAdmin();
    console.log('📊 Управление кнопкой статистики:');
    console.log('👑 Пользователь администратор?:', isAdmin);
    console.log('🎯 Текущий стиль кнопки:', statsBtn.style.display);

    if (isAdmin) {
        statsBtn.style.display = 'block'; // или 'inline-block' в зависимости от CSS
        console.log('✅ Кнопка статистики показана');
    } else {
        statsBtn.style.display = 'none';
        console.log('❌ Кнопка статистики скрыта');
    }
}

function setupEventListeners() {
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    window.addEventListener('click', function (event) {
        const modal = document.getElementById('detailsModal');
        if (event.target == modal) {
            closeModal();
        }
    });

    // Обработчик для кнопки статистики
    const statsBtn = document.getElementById('statisticsBtn');
    if (statsBtn) {
        statsBtn.addEventListener('click', showStatisticsPage);
    }
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        apiService.clearData();
        window.location.href = 'login.html';
    }
}

function showStatisticsPage() {
    console.log('📊 Переход на страницу статистики');
    window.location.href = 'statistics.html';
}

function onTableSelect() {
    const tableSelect = document.getElementById('tableSelect');
    const generateBtn = document.getElementById('generateBtn');

    if (tableSelect.value) {
        generateBtn.disabled = false;
        currentTable = tableSelect.value;
        generateData();
    } else {
        generateBtn.disabled = true;
        currentTable = '';
        clearTable();
    }
}

function refreshData() {
    if (currentTable) {
        generateData();
    } else {
        showNotification('Сначала выберите таблицу', 'warning');
    }
}

async function generateData() {
    if (!currentTable) {
        showNotification('Выберите таблицу', 'error');
        return;
    }

    const loading = document.getElementById('loading');
    const noData = document.getElementById('noData');
    const tableContainer = document.getElementById('dataTableContainer');

    loading.classList.add('active');
    noData.style.display = 'none';
    tableContainer.style.display = 'none';

    try {
        currentData = await fetchTableData(currentTable);

        if (!currentData || currentData.length === 0) {
            noData.textContent = 'В таблице нет данных';
            noData.style.display = 'block';
            tableContainer.style.display = 'none';
            showNotification('Данные не найдены', 'info');
        } else {
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

async function fetchTableData(tableName) {
    try {
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
        const response = await apiService.request(endpoint);

        if (!response) {
            throw new Error('Сервер не вернул данные');
        }

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

function convertToArray(response) {
    if (Array.isArray(response)) {
        return response;
    }

    if (response && typeof response === 'object') {
        const arrayProperties = ['data', 'items', 'results', 'records'];
        for (const prop of arrayProperties) {
            if (response[prop] && Array.isArray(response[prop])) {
                return response[prop];
            }
        }

        const idFields = ['id', 'Id', 'IdUsers', 'IdEquipment', 'IdFuel', 'IdGeyser', 'IdRepair', 'IdRoles'];
        for (const field of idFields) {
            if (response[field] !== undefined) {
                return [response];
            }
        }
    }

    return [];
}

function displayTableData(data) {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');

    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    if (!data || data.length === 0) {
        return;
    }

    const firstItem = data[0];
    const headers = Object.keys(firstItem);

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

    const actionsTh = document.createElement('th');
    actionsTh.textContent = 'Действия';
    headerRow.appendChild(actionsTh);

    tableHeader.appendChild(headerRow);

    data.forEach((row) => {
        const tableRow = document.createElement('tr');

        displayHeaders.forEach(header => {
            const td = document.createElement('td');
            let value = row[header];
            value = formatValue(value);
            td.textContent = value;
            tableRow.appendChild(td);
        });

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

function formatValue(value) {
    if (value === null || value === undefined) {
        return '-';
    }

    if (typeof value === 'boolean') {
        return value ? 'Да' : 'Нет';
    }

    if (typeof value === 'number') {
        if (value.toString().includes('.') || value.toString().includes(',')) {
            return value.toFixed(2).replace('.', ',') + ' ₽';
        }
        return value.toLocaleString('ru-RU');
    }

    if (typeof value === 'string') {
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

    const words = header.replace(/([A-Z])/g, ' $1').trim().split(' ');
    return words.map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}

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

function closeModal() {
    document.getElementById('detailsModal').style.display = 'none';
}

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
    `;

    document.body.appendChild(notification);

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
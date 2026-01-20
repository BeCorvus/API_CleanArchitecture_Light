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

    // Обновляем список таблиц в зависимости от роли
    updateTableSelectBasedOnRole();

    // Проверка прав доступа
    setTimeout(() => {
        console.log('🔍 Проверка прав доступа...');
        manageStatisticsButton();
    }, 1000);
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

        manageStatisticsButton();
        updateTableSelectBasedOnRole();

        console.log('📊 Проверка доступа к статистике:');
        console.log('👑 Администратор?:', api.isAdmin());
        console.log('👔 Менеджер?:', api.isManager());
        console.log('✅ Может просматривать статистику?:', api.canViewStatistics());
    } else {
        console.warn('⚠️ Роль пользователя не найдена в localStorage');
        manageStatisticsButton();
    }
}

function getHiddenFieldsForRole() {
    const isAdmin = api.isAdmin();

    if (isAdmin) {
        return ['passwordHash', 'resetToken', 'resetTokenExpiry'];
    } else {
        return [
            'passwordHash', 'resetToken', 'resetTokenExpiry',
            'dateOfRecording', 'dateOfChange', 'whoRecorded',
            'whoChanged', 'whenDeleted',
            'Date_of_recording', 'Date_of_change', 'Who_recorded',
            'Who_changed', 'WhenDeleted',
            'date_of_recording', 'date_of_change', 'who_recorded',
            'who_changed', 'whendeleted'
        ];
    }
}

function shouldHideIdColumns() {
    const isAdmin = api.isAdmin();
    return !isAdmin;
}

function isIdColumn(header) {
    if (!header) return false;
    const headerLower = header.toString().toLowerCase();
    return headerLower.includes('id') &&
        !headerLower.includes('idea') &&
        !headerLower.includes('identity');
}

function isServiceColumn(header) {
    if (!header) return false;
    const headerLower = header.toString().toLowerCase();

    return headerLower.includes('record') ||
        headerLower.includes('change') ||
        headerLower.includes('who') ||
        headerLower.includes('when') ||
        headerLower.includes('delete');
}

function getServiceFieldOrder(header) {
    if (!header) return 999;

    const headerLower = header.toString().toLowerCase();
    const cleanHeader = headerLower.replace(/[^a-z]/g, '');

    if (cleanHeader.includes('daterecord') || cleanHeader.includes('recorddate')) {
        return 1;
    } else if (cleanHeader.includes('datechange') || cleanHeader.includes('changedate')) {
        return 2;
    } else if (cleanHeader.includes('whorecord') || cleanHeader.includes('recordwho')) {
        return 3;
    } else if (cleanHeader.includes('whochange') || cleanHeader.includes('changewho')) {
        return 4;
    } else if (cleanHeader.includes('whendelete') || cleanHeader.includes('deletewhen')) {
        return 5;
    } else if (cleanHeader.includes('date') && cleanHeader.includes('record')) {
        return 1;
    } else if (cleanHeader.includes('date') && cleanHeader.includes('change')) {
        return 2;
    } else if (cleanHeader.includes('who') && cleanHeader.includes('record')) {
        return 3;
    } else if (cleanHeader.includes('who') && cleanHeader.includes('change')) {
        return 4;
    } else if (cleanHeader.includes('when') && cleanHeader.includes('delete')) {
        return 5;
    }

    return 999;
}

function sortHeadersForAdmin(headers) {
    const isAdmin = api.isAdmin();

    if (!isAdmin) {
        return headers;
    }

    const regularHeaders = [];
    const serviceHeaders = [];

    headers.forEach(header => {
        const order = getServiceFieldOrder(header);
        if (order < 999) {
            serviceHeaders.push({ header, order });
        } else {
            regularHeaders.push(header);
        }
    });

    serviceHeaders.sort((a, b) => a.order - b.order);
    const sortedServiceHeaders = serviceHeaders.map(item => item.header);

    console.log('📊 Порядок служебных полей для администратора:');
    console.log('📌 Обычные поля:', regularHeaders);
    console.log('🔧 Служебные поля:', sortedServiceHeaders);

    return [...regularHeaders, ...sortedServiceHeaders];
}

function updateTableSelectBasedOnRole() {
    const tableSelect = document.getElementById('tableSelect');
    if (!tableSelect) {
        console.error('❌ Элемент выбора таблицы не найден');
        return;
    }

    const isAdmin = api.isAdmin();
    console.log('🎭 Обновление списка таблиц для роли. Админ?:', isAdmin);

    const options = tableSelect.options;

    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const value = option.value;

        if (value === 'users' || value === 'roles') {
            if (isAdmin) {
                option.style.display = 'block';
                option.disabled = false;
                option.classList.remove('hidden');
                console.log(`✅ Таблица "${option.text}" доступна для админа`);
            } else {
                option.style.display = 'none';
                option.disabled = true;
                option.classList.add('hidden');
                console.log(`🚫 Таблица "${option.text}" скрыта для не-админа`);

                if (tableSelect.value === value) {
                    tableSelect.value = '';
                    currentTable = '';
                    clearTable();

                    const generateBtn = document.getElementById('generateBtn');
                    if (generateBtn) {
                        generateBtn.disabled = true;
                    }

                    showNotification('Доступ к этой таблице ограничен. Выберите другую таблицу.', 'warning');
                }
            }
        }
    }

    const visibleOptions = Array.from(options).filter(opt => opt.style.display !== 'none');
    const noDataDiv = document.getElementById('noData');

    if (visibleOptions.length === 0 && noDataDiv) {
        noDataDiv.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h3>Нет доступных таблиц</h3>
                <p>У вашей роли нет прав доступа к таблицам.</p>
                <p>Обратитесь к администратору.</p>
            </div>
        `;
    }
}

function manageStatisticsButton() {
    const statsBtn = document.getElementById('statisticsBtn');
    if (!statsBtn) {
        console.error('❌ Кнопка статистики не найдена в DOM');
        return;
    }

    const canViewStats = api.canViewStatistics();

    console.log('📊 Управление кнопки статистики:');
    console.log('👑 Администратор?:', api.isAdmin());
    console.log('👔 Менеджер?:', api.isManager());
    console.log('✅ Может просматривать статистику?:', canViewStats);

    if (canViewStats) {
        statsBtn.classList.remove('hidden');
        statsBtn.style.display = 'inline-block';
        console.log('✅ Кнопка статистики показана');
    } else {
        statsBtn.classList.add('hidden');
        statsBtn.style.display = 'none';
        console.log('❌ Кнопка статистики скрыта');
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

    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
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

    const statsBtn = document.getElementById('statisticsBtn');
    if (statsBtn) {
        statsBtn.addEventListener('click', showStatisticsPage);
    }
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        api.logout();
    }
}

function showStatisticsPage() {
    console.log('📊 Попытка перехода на страницу статистики');

    if (!api.canViewStatistics()) {
        alert('Доступ к статистике только для администраторов и менеджеров');
        return;
    }

    testStatisticsAccess()
        .then(hasAccess => {
            if (hasAccess) {
                console.log('✅ Доступ подтвержден, переход на страницу статистики');
                window.location.href = 'statistics.html';
            } else {
                alert('Сервер не разрешает доступ к статистике. Обратитесь к администратору.');
            }
        })
        .catch(error => {
            console.error('❌ Ошибка проверки доступа:', error);
            alert('Ошибка проверки доступа: ' + error.message);
        });
}

async function testStatisticsAccess() {
    try {
        console.log('🔍 Тестируем доступ к статистике...');
        console.log('🔑 Токен:', api.token);
        console.log('🎭 Роль:', api.userRole);

        const response = await fetch('http://localhost:5077/api/statistics', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${api.token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📊 Ответ сервера:', response.status, response.statusText);

        if (response.ok) {
            return true;
        } else if (response.status === 403) {
            const errorData = await response.text();
            console.error('❌ Доступ запрещен:', errorData);
            return false;
        } else {
            console.error('❌ Неизвестная ошибка:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Ошибка запроса:', error);
        throw error;
    }
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
        console.log(`📥 Запрос данных для таблицы: ${tableName}`);

        // Используем метод из API
        const response = await api.getTableData(tableName);

        console.log(`📊 Данные получены для ${tableName}:`, response);

        if (!response || response.length === 0) {
            console.log(`⚠️ Нет данных для таблицы ${tableName}`);
            return [];
        }

        return response;
    } catch (error) {
        console.error(`❌ Ошибка загрузки ${tableName}:`, error);
        showNotification(`Ошибка при загрузке данных: ${error.message}`, 'error');
        return [];
    }
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

    // Получаем поля для скрытия
    const hiddenFields = getHiddenFieldsForRole();

    // Сначала фильтруем скрытые поля
    let displayHeaders = headers.filter(header =>
        !hiddenFields.includes(header.toLowerCase())
    );

    // Фильтрация ID столбцов для не-администраторов
    if (shouldHideIdColumns()) {
        console.log('🚫 Скрываем ID столбцы для не-администратора');
        displayHeaders = displayHeaders.filter(header => !isIdColumn(header));
    }

    // Для администратора сортируем заголовки - служебные поля в конце
    displayHeaders = sortHeadersForAdmin(displayHeaders);

    console.log('📋 Итоговый порядок столбцов:');
    displayHeaders.forEach((header, index) => {
        const order = getServiceFieldOrder(header);
        console.log(`${index + 1}. ${header} (порядок: ${order})`);
    });

    const headerRow = document.createElement('tr');

    // Столбец с нумерацией
    const numberTh = document.createElement('th');
    numberTh.textContent = '№';
    numberTh.style.width = '60px';
    numberTh.style.textAlign = 'center';
    headerRow.appendChild(numberTh);

    displayHeaders.forEach((header, index) => {
        const th = document.createElement('th');
        th.textContent = formatHeader(header);

        // Добавляем классы для служебных полей администратора
        const order = getServiceFieldOrder(header);
        if (api.isAdmin() && order < 999) {
            th.classList.add('admin-service-header');
            th.style.backgroundColor = '#e8f5e9';
            th.style.borderLeft = '2px solid #4caf50';
            th.title = `Служебное поле (порядок: ${order})`;
        }

        headerRow.appendChild(th);
    });

    const actionsTh = document.createElement('th');
    actionsTh.textContent = 'Действия';
    actionsTh.style.width = '100px';
    actionsTh.style.textAlign = 'center';
    headerRow.appendChild(actionsTh);

    tableHeader.appendChild(headerRow);

    data.forEach((row, rowIndex) => {
        const tableRow = document.createElement('tr');

        // Ячейка с номером строки
        const numberTd = document.createElement('td');
        numberTd.textContent = rowIndex + 1;
        numberTd.style.textAlign = 'center';
        numberTd.style.fontWeight = 'bold';
        numberTd.style.backgroundColor = '#f8f9fa';
        tableRow.appendChild(numberTd);

        displayHeaders.forEach((header, colIndex) => {
            const td = document.createElement('td');
            let value = row[header];
            value = formatValue(value);
            td.textContent = value;

            // Специальное форматирование для служебных полей администратора
            if (api.isAdmin()) {
                const order = getServiceFieldOrder(header);

                if (order < 999) {
                    // Служебные поля дат (порядок 1 и 2)
                    if (order === 1 || order === 2) {
                        td.classList.add('admin-service-field-date');
                        td.style.fontFamily = 'monospace';
                        td.style.fontSize = '12px';
                        td.style.color = '#0066cc';
                        td.style.backgroundColor = '#f0f8ff';
                        td.title = `Дата (порядок: ${order})`;
                    }
                    // Служебные поля "кто" (порядок 3 и 4)
                    else if (order === 3 || order === 4) {
                        td.classList.add('admin-service-field-user');
                        td.style.fontStyle = 'italic';
                        td.style.color = '#666';
                        td.style.backgroundColor = '#f9f9f9';
                        td.title = `Пользователь (порядок: ${order})`;
                    }
                    // Служебные поля "когда удалено" (порядок 5)
                    else if (order === 5) {
                        td.classList.add('admin-service-field-delete');
                        td.style.fontFamily = 'monospace';
                        td.style.fontSize = '11px';
                        td.style.color = '#cc0000';
                        td.style.backgroundColor = '#fff0f0';
                        td.title = 'Дата удаления';
                    }
                    // Остальные служебные поля
                    else {
                        td.classList.add('admin-service-field');
                        td.style.fontFamily = 'monospace';
                        td.style.fontSize = '11px';
                        td.style.color = '#0066cc';
                        td.title = `Служебное поле (порядок: ${order})`;
                    }
                }
                // ID поля
                else if (isIdColumn(header)) {
                    td.style.fontFamily = 'monospace';
                    td.style.backgroundColor = '#fff0f0';
                    td.style.fontWeight = 'bold';
                    td.style.color = '#990000';
                }
            }

            tableRow.appendChild(td);
        });

        const actionsTd = document.createElement('td');
        actionsTd.className = 'actions-cell';
        actionsTd.style.textAlign = 'center';

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
                    return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
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
        'isactive': 'Активен',
        'dateofrecording': 'Дата записи',
        'date_of_recording': 'Дата записи',
        'Date_of_recording': 'Дата записи',
        'dateofchange': 'Дата изменения',
        'date_of_change': 'Дата изменения',
        'Date_of_change': 'Дата изменения',
        'whorecorded': 'Кто записал',
        'who_recorded': 'Кто записал',
        'Who_recorded': 'Кто записал',
        'whochanged': 'Кто изменил',
        'who_changed': 'Кто изменил',
        'Who_changed': 'Кто изменил',
        'whendeleted': 'Когда удалено',
        'WhenDeleted': 'Когда удалено',
        'recordedby': 'Записано',
        'changedby': 'Изменено',
        'createdby': 'Создано',
        'modifiedby': 'Изменено',
        'deletedby': 'Удалено',
        'createdat': 'Создано',
        'updatedat': 'Обновлено',
        'deletedat': 'Удалено'
    };

    const lowerHeader = header.toLowerCase();

    if (translations[header]) {
        return translations[header];
    }

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

    let fieldsToShow = displayHeaders || Object.keys(data);

    const hiddenFields = getHiddenFieldsForRole();
    fieldsToShow = fieldsToShow.filter(header =>
        !hiddenFields.includes(header.toLowerCase())
    );

    if (shouldHideIdColumns()) {
        fieldsToShow = fieldsToShow.filter(header => !isIdColumn(header));
    }

    if (api.isAdmin()) {
        fieldsToShow = sortHeadersForAdmin(fieldsToShow);
    }

    fieldsToShow.forEach(key => {
        let value = data[key];
        value = formatValue(value);

        const order = getServiceFieldOrder(key);
        const isService = order < 999;
        const isId = isIdColumn(key);

        html += `
            <div class="detail-row">
                <span class="detail-label ${isService || isId ? 'admin-label' : ''}">
                    ${isService ? '🔧 ' : ''}${isId ? '🆔 ' : ''}${formatHeader(key)}:
                </span>
                <span class="detail-value ${isService || isId ? 'admin-value' : ''}">
                    ${value}
                </span>
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

// Добавляем функцию отладки
function debugDashboard() {
    console.log('🐛 Отладка панели управления:');
    console.log('🎭 Роль пользователя:', api.userRole);
    console.log('👤 Имя пользователя:', api.userName);
    console.log('👑 Администратор?:', api.isAdmin());
    console.log('👔 Менеджер?:', api.isManager());
    console.log('📊 Может смотреть статистику?:', api.canViewStatistics());
    console.log('📋 Текущая таблица:', currentTable);
    console.log('📊 Текущие данные:', currentData ? currentData.length : 0, 'записей');

    if (currentData && currentData.length > 0) {
        console.log('🔍 Структура данных:');
        const firstItem = currentData[0];
        console.log('🔑 Ключи:', Object.keys(firstItem));

        // Проверяем наличие служебных полей
        const serviceFields = Object.keys(firstItem).filter(key => isServiceColumn(key));
        console.log('🔧 Служебные поля в данных:', serviceFields);

        if (api.isAdmin() && serviceFields.length === 0) {
            console.warn('⚠️ ВНИМАНИЕ: Администратор не видит служебные поля!');
            console.warn('⚠️ Проверьте endpoint - возможно нужно использовать /admin endpoint');
        }
    }
}

// Добавляем кнопку отладки в интерфейс
document.addEventListener('DOMContentLoaded', function () {
    const debugBtn = document.createElement('button');
    debugBtn.textContent = '🐛 Отладка';
    debugBtn.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        z-index: 9999;
        padding: 5px 10px;
        background: #ff6b6b;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
    `;
    debugBtn.onclick = debugDashboard;
    document.body.appendChild(debugBtn);
});

// Экспорт функций
window.showStatisticsPage = showStatisticsPage;
window.logout = logout;
window.onTableSelect = onTableSelect;
window.generateData = generateData;
window.refreshData = refreshData;
window.viewDetails = viewDetails;
window.closeModal = closeModal;
window.debugDashboard = debugDashboard;
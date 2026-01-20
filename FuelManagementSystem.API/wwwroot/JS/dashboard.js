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

    // Дополнительная проверка через 1 секунду
    setTimeout(() => {
        console.log('🔍 Дополнительная проверка прав доступа...');
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

        // Обновляем список таблиц в зависимости от роли
        updateTableSelectBasedOnRole();

        // ✅ ДОБАВЛЕНО: Выводим информацию о доступе к статистике
        console.log('📊 Проверка доступа к статистике:');
        console.log('👑 Администратор?:', apiService.isAdmin());
        console.log('👔 Менеджер?:', apiService.isManager());
        console.log('✅ Может просматривать статистику?:', apiService.canViewStatistics());
    } else {
        console.warn('⚠️ Роль пользователя не найдена в localStorage');
        // Все равно проверяем кнопку
        manageStatisticsButton();
    }
}

// ✅ ОБНОВЛЕННАЯ ФУНКЦИЯ: Определяет, какие поля нужно скрывать в зависимости от роли
function getHiddenFieldsForRole() {
    const isAdmin = apiService.isAdmin();

    if (isAdmin) {
        // ✅ Администратор видит все поля, кроме чувствительных
        return ['passwordHash', 'resetToken', 'resetTokenExpiry'];
    } else {
        // ✅ Не-администраторы не видят ID поля и служебные поля
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

// ✅ ОБНОВЛЕННАЯ ФУНКЦИЯ: Определяет, нужно ли скрывать ID столбцы
function shouldHideIdColumns() {
    const isAdmin = apiService.isAdmin();
    return !isAdmin; // Скрываем ID для всех, кроме администраторов
}

// ✅ ОБНОВЛЕННАЯ ФУНКЦИЯ: Проверяет, содержит ли заголовок ID
function isIdColumn(header) {
    if (!header) return false;
    const headerLower = header.toString().toLowerCase();
    return headerLower.includes('id') &&
        !headerLower.includes('idea') &&
        !headerLower.includes('identity');
}

// ✅ НОВАЯ ФУНКЦИЯ: Определяет, является ли поле служебным
function isServiceColumn(header) {
    if (!header) return false;
    const headerLower = header.toString().toLowerCase();

    // ✅ Проверяем различные варианты написания служебных полей
    return headerLower.includes('dateofrecording') ||
        headerLower.includes('date_of_recording') ||
        headerLower.includes('dateofchange') ||
        headerLower.includes('date_of_change') ||
        headerLower.includes('whorecorded') ||
        headerLower.includes('who_recorded') ||
        headerLower.includes('whochanged') ||
        headerLower.includes('who_changed') ||
        headerLower.includes('whendeleted') ||
        headerLower.includes('recordedby') ||
        headerLower.includes('changedby') ||
        headerLower.includes('createdby') ||
        headerLower.includes('modifiedby') ||
        headerLower.includes('createdat') ||
        headerLower.includes('updatedat') ||
        headerLower.includes('deletedat') ||
        headerLower.includes('date') && headerLower.includes('record') ||
        headerLower.includes('date') && headerLower.includes('change');
}

// ✅ НОВАЯ ФУНКЦИЯ: Сортируем заголовки в правильном порядке (служебные поля в конце)
function sortHeadersForAdmin(headers) {
    const isAdmin = apiService.isAdmin();

    if (!isAdmin) {
        return headers; // Для не-администраторов не сортируем
    }

    // ✅ Определяем порядок служебных полей
    const serviceFieldOrder = [
        // Основные служебные поля в нужном порядке
        'Date_of_recording', 'date_of_recording', 'DateOfRecording', 'dateOfRecording',
        'Date_of_change', 'date_of_change', 'DateOfChange', 'dateOfChange',
        'Who_recorded', 'who_recorded', 'WhoRecorded', 'whoRecorded',
        'Who_changed', 'who_changed', 'WhoChanged', 'whoChanged',
        'WhenDeleted', 'whenDeleted', 'When_Deleted', 'when_deleted'
    ];

    // Разделяем заголовки на обычные и служебные
    const regularHeaders = [];
    const serviceHeaders = [];

    headers.forEach(header => {
        // Проверяем, является ли поле служебным
        let isService = false;

        // Проверяем точное соответствие с учетом регистра
        if (serviceFieldOrder.includes(header)) {
            isService = true;
        } else {
            // Проверяем по нижнему регистру
            const headerLower = header.toLowerCase();
            isService = serviceFieldOrder.some(serviceField =>
                serviceField.toLowerCase() === headerLower
            );
        }

        // Также проверяем через функцию isServiceColumn
        if (!isService && isServiceColumn(header)) {
            isService = true;
        }

        if (isService) {
            serviceHeaders.push(header);
        } else {
            regularHeaders.push(header);
        }
    });

    // Сортируем служебные поля в заданном порядке
    const sortedServiceHeaders = [];

    // Добавляем в порядке, определенном в serviceFieldOrder
    serviceFieldOrder.forEach(orderedField => {
        // Ищем точное совпадение
        const exactMatch = serviceHeaders.find(header => header === orderedField);
        if (exactMatch && !sortedServiceHeaders.includes(exactMatch)) {
            sortedServiceHeaders.push(exactMatch);
        }

        // Ищем совпадение без учета регистра
        const orderedFieldLower = orderedField.toLowerCase();
        const caseInsensitiveMatch = serviceHeaders.find(header =>
            header.toLowerCase() === orderedFieldLower &&
            !sortedServiceHeaders.includes(header)
        );
        if (caseInsensitiveMatch) {
            sortedServiceHeaders.push(caseInsensitiveMatch);
        }
    });

    // Добавляем оставшиеся служебные поля
    serviceHeaders.forEach(header => {
        if (!sortedServiceHeaders.includes(header)) {
            sortedServiceHeaders.push(header);
        }
    });

    // Объединяем: сначала обычные поля, затем служебные
    return [...regularHeaders, ...sortedServiceHeaders];
}

// ✅ НОВАЯ ФУНКЦИЯ: Обновление списка таблиц в зависимости от роли
function updateTableSelectBasedOnRole() {
    const tableSelect = document.getElementById('tableSelect');
    if (!tableSelect) {
        console.error('❌ Элемент выбора таблицы не найден');
        return;
    }

    const isAdmin = apiService.isAdmin();
    console.log('🎭 Обновление списка таблиц для роли. Админ?:', isAdmin);

    // Находим опции для таблиц пользователей и ролей
    const options = tableSelect.options;

    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const value = option.value;

        // Скрываем/показываем опции в зависимости от роли
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

                // Если эта таблица была выбрана, сбрасываем выбор
                if (tableSelect.value === value) {
                    tableSelect.value = '';
                    currentTable = '';
                    clearTable();

                    // Отключаем кнопку генерации
                    const generateBtn = document.getElementById('generateBtn');
                    if (generateBtn) {
                        generateBtn.disabled = true;
                    }

                    showNotification('Доступ к этой таблице ограничен. Выберите другую таблицу.', 'warning');
                }
            }
        }
    }

    // Если все опции скрыты, показываем сообщение
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

    // ✅ Используем метод canViewStatistics() из api.js
    const canViewStats = apiService.canViewStatistics();

    console.log('📊 Управление кнопки статистики:');
    console.log('👑 Администратор?:', apiService.isAdmin());
    console.log('👔 Менеджер?:', apiService.isManager());
    console.log('✅ Может просматривать статистику?:', canViewStats);
    console.log('🎯 Текущий стиль кнопки:', statsBtn.style.display);

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

    // Для неизвестных ролей - первая буква заглавная
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
    console.log('📊 Попытка перехода на страницу статистики');

    // ✅ Проверяем доступ через API Service
    if (!apiService.canViewStatistics()) {
        alert('Доступ к статистике только для администраторов и менеджеров');
        return;
    }

    // ✅ Делаем тестовый запрос к статистике для проверки
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

// Новая функция для тестирования доступа к статистике
async function testStatisticsAccess() {
    try {
        console.log('🔍 Тестируем доступ к статистике...');
        console.log('🔑 Токен:', apiService.token);
        console.log('🎭 Роль:', apiService.userRole);

        // Пробуем сделать запрос к статистике
        const response = await fetch('http://localhost:5077/api/statistics', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiService.token}`,
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

    // ✅ ОБНОВЛЕНО: Используем динамический список исключаемых полей
    const hiddenFields = getHiddenFieldsForRole();

    // Сначала фильтруем скрытые поля
    let displayHeaders = headers.filter(header =>
        !hiddenFields.includes(header.toLowerCase())
    );

    // ✅ ДОБАВЛЕНО: Фильтрация ID столбцов для не-администраторов
    if (shouldHideIdColumns()) {
        console.log('🚫 Скрываем ID столбцы для не-администратора');
        displayHeaders = displayHeaders.filter(header => !isIdColumn(header));
    }

    // ✅ ВАЖНО: Для администратора сортируем заголовки - служебные поля в конце
    displayHeaders = sortHeadersForAdmin(displayHeaders);

    const headerRow = document.createElement('tr');

    // ✅ ДОБАВЛЕНО: Столбец с нумерацией
    const numberTh = document.createElement('th');
    numberTh.textContent = '№';
    numberTh.style.width = '60px';
    numberTh.style.textAlign = 'center';
    headerRow.appendChild(numberTh);

    displayHeaders.forEach(header => {
        const th = document.createElement('th');
        th.textContent = formatHeader(header);

        // ✅ ДОБАВЛЕНО: Добавляем классы для служебных полей администратора
        if (apiService.isAdmin() && isServiceColumn(header)) {
            th.classList.add('admin-service-header');
            th.style.backgroundColor = '#e8f5e9';
            th.style.borderLeft = '2px solid #4caf50';
        }

        headerRow.appendChild(th);
    });

    const actionsTh = document.createElement('th');
    actionsTh.textContent = 'Действия';
    actionsTh.style.width = '100px';
    actionsTh.style.textAlign = 'center';
    headerRow.appendChild(actionsTh);

    tableHeader.appendChild(headerRow);

    data.forEach((row, index) => {
        const tableRow = document.createElement('tr');

        // ✅ ДОБАВЛЕНО: Ячейка с номером строки
        const numberTd = document.createElement('td');
        numberTd.textContent = index + 1;
        numberTd.style.textAlign = 'center';
        numberTd.style.fontWeight = 'bold';
        numberTd.style.backgroundColor = '#f8f9fa';
        tableRow.appendChild(numberTd);

        displayHeaders.forEach(header => {
            const td = document.createElement('td');
            let value = row[header];
            value = formatValue(value);
            td.textContent = value;

            // ✅ ДОБАВЛЕНО: Специальное форматирование для служебных полей администратора
            if (apiService.isAdmin()) {
                const lowerHeader = header.toLowerCase();
                if (isServiceColumn(header)) {
                    // ✅ Служебные поля дат
                    if (lowerHeader.includes('date') || lowerHeader.includes('time')) {
                        td.classList.add('admin-service-field-date');
                        td.style.fontFamily = 'monospace';
                        td.style.fontSize = '12px';
                        td.style.color = '#0066cc';
                        td.style.backgroundColor = '#f0f8ff';
                    }
                    // ✅ Служебные поля "кто"
                    else if (lowerHeader.includes('who') || lowerHeader.includes('by')) {
                        td.classList.add('admin-service-field-user');
                        td.style.fontStyle = 'italic';
                        td.style.color = '#666';
                        td.style.backgroundColor = '#f9f9f9';
                    }
                    // ✅ Остальные служебные поля
                    else {
                        td.classList.add('admin-service-field');
                        td.style.fontFamily = 'monospace';
                        td.style.fontSize = '11px';
                        td.style.color = '#0066cc';
                    }
                }
                // ✅ ID поля
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
        // ✅ ДОБАВЛЕНО: Переводы для служебных полей с разными вариантами написания
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

    // Сначала ищем точное совпадение (с учетом регистра)
    if (translations[header]) {
        return translations[header];
    }

    // Затем ищем совпадение в нижнем регистре
    if (translations[lowerHeader]) {
        return translations[lowerHeader];
    }

    // Форматируем заголовок, если не нашли перевод
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

    // ✅ ОБНОВЛЕНО: Используем динамический список исключаемых полей
    const hiddenFields = getHiddenFieldsForRole();
    fieldsToShow = fieldsToShow.filter(header =>
        !hiddenFields.includes(header.toLowerCase())
    );

    // ✅ ДОБАВЛЕНО: Фильтрация ID полей для не-администраторов в модальном окне
    if (shouldHideIdColumns()) {
        fieldsToShow = fieldsToShow.filter(header => !isIdColumn(header));
    }

    // ✅ ДОБАВЛЕНО: Для администратора сортируем служебные поля в конце
    if (apiService.isAdmin()) {
        fieldsToShow = sortHeadersForAdmin(fieldsToShow);
    }

    fieldsToShow.forEach(key => {
        let value = data[key];
        value = formatValue(value);

        const isService = apiService.isAdmin() && isServiceColumn(key);
        const isId = apiService.isAdmin() && isIdColumn(key);

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

// Экспорт функций
window.showStatisticsPage = showStatisticsPage;
window.logout = logout;
window.onTableSelect = onTableSelect;
window.generateData = generateData;
window.refreshData = refreshData;
window.viewDetails = viewDetails;
window.closeModal = closeModal;
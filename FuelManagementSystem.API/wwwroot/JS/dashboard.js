// Глобальные переменные
let currentTable = '';
let currentData = [];
let currentFilters = {};
let sortColumn = '';
let sortDirection = 'asc';
let isInitialized = false;

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Инициализация панели управления...');
    initializeDashboard();
});

// Основная функция инициализации
async function initializeDashboard() {
    try {
        // Проверяем авторизацию
        await checkAuth();

        // Настраиваем обработчики событий
        setupEventListeners();

        // Инициализируем панель
        initDashboard();

        // Обновляем информацию о пользователе
        updateUserInfo();

        isInitialized = true;
        console.log('✅ Панель управления инициализирована');
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        showNotification('Ошибка загрузки приложения', 'error');
    }
}

// Проверка авторизации пользователя
async function checkAuth() {
    const token = localStorage.getItem('authToken');

    if (!token) {
        console.log('🔐 Токен не найден, перенаправление на страницу входа');
        window.location.href = 'login.html';
        return;
    }

    console.log('🔐 Проверка авторизации...');

    try {
        // Пытаемся проверить токен через API
        await api.request('/auth/validate');
        console.log('✅ Авторизация подтверждена');
    } catch (error) {
        if (error.status === 401) {
            console.warn('⚠️ Токен недействителен, выход из системы');
            api.logout();
        } else {
            console.warn('⚠️ Ошибка проверки токена, продолжаем работу:', error.message);
        }
    }
}

// Инициализация панели управления
function initDashboard() {
    console.log('📊 Инициализация панели...');

    clearTable();
    updateTableSelectBasedOnRole();
    updateButtonStates();

    setTimeout(() => {
        showNotification('Панель управления готова к работе', 'success');
    }, 500);
}

// Настройка обработчиков событий
function setupEventListeners() {
    console.log('🎮 Настройка обработчиков событий...');

    // Кнопка выхода
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Кнопка статистики
    const statsBtn = document.getElementById('statisticsBtn');
    if (statsBtn) {
        statsBtn.addEventListener('click', showStatisticsPage);
    }

    // Выпадающий список таблиц
    const tableSelect = document.getElementById('tableSelect');
    if (tableSelect) {
        tableSelect.addEventListener('change', onTableSelect);
    }

    // Кнопка обновления данных
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateData);
    }

    // Кнопка создания данных
    const createBtn = document.getElementById('createDataBtn');
    if (createBtn) {
        createBtn.addEventListener('click', showCreateModal);
    }

    // Обработка закрытия модальных окон
    window.addEventListener('click', function (event) {
        const modal = document.getElementById('detailsModal');
        if (event.target == modal) {
            closeModal();
        }

        const editModal = document.getElementById('editModal');
        if (editModal && event.target == editModal) {
            closeEditModal();
        }
    });

    // Закрытие по кнопке
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('close-modal')) {
            const modal = event.target.closest('.modal');
            if (modal) {
                if (modal.id === 'detailsModal') {
                    closeModal();
                } else if (modal.id === 'editModal') {
                    closeEditModal();
                }
            }
        }
    });

    // Обработка клавиши Escape
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeModal();
            closeEditModal();
        }
    });

    console.log('✅ Обработчики событий настроены');
}

// ==================== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЕМ ====================

// Обновление информации о пользователе
function updateUserInfo() {
    const userName = localStorage.getItem('userName') || 'Гость';
    const userRole = localStorage.getItem('userRole') || 'user';

    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');

    if (userNameElement) {
        userNameElement.textContent = userName;
    }

    if (userRoleElement) {
        userRoleElement.textContent = formatDisplayRole(userRole);
    }

    showAdminIndicator();
    manageStatisticsButton();

    console.log('👤 Информация о пользователе обновлена:', { userName, userRole });
}

// Форматирование роли для отображения
function formatDisplayRole(role) {
    if (!role) return 'Пользователь';

    const roleLower = role.toString().toLowerCase().trim();

    if (roleLower.includes('admin') || roleLower.includes('админ')) {
        return 'Администратор';
    } else if (roleLower.includes('manager') || roleLower.includes('менеджер')) {
        return 'Менеджер';
    } else if (roleLower.includes('operator') || roleLower.includes('оператор')) {
        return 'Оператор';
    } else if (roleLower.includes('tech') || roleLower.includes('техник')) {
        return 'Техник';
    } else if (roleLower.includes('supervisor') || roleLower.includes('супервайзер')) {
        return 'Супервайзер';
    } else if (roleLower.includes('user') || roleLower.includes('пользователь')) {
        return 'Пользователь';
    }

    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

// Выход из системы
function handleLogout() {
    if (confirm('Вы уверены, что хотите выйти из системы?')) {
        console.log('👋 Выход из системы...');
        api.logout();
    }
}

// Управление отображением кнопки статистики
function manageStatisticsButton() {
    const statsBtn = document.getElementById('statisticsBtn');
    if (!statsBtn) return;

    const canViewStats = api.canViewStatistics();

    if (canViewStats) {
        statsBtn.style.display = 'inline-block';
        statsBtn.classList.remove('hidden');

        if (api.isAdmin()) {
            statsBtn.classList.add('admin-statistics-btn');
        } else if (api.isManager()) {
            statsBtn.classList.add('manager-statistics-btn');
        }
    } else {
        statsBtn.style.display = 'none';
        statsBtn.classList.add('hidden');
    }
}

// Показать индикатор администратора
function showAdminIndicator() {
    if (!api.isAdmin()) return;

    const oldIndicator = document.querySelector('.admin-mode-indicator');
    if (oldIndicator) oldIndicator.remove();

    const indicator = document.createElement('div');
    indicator.className = 'admin-mode-indicator';
    indicator.textContent = '👑 РЕЖИМ АДМИНИСТРАТОРА';
    indicator.title = 'Вы вошли как администратор. Доступны все функции.';

    document.body.appendChild(indicator);
    console.log('👑 Индикатор режима администратора добавлен');
}

// ==================== УПРАВЛЕНИЕ ТАБЛИЦАМИ ====================

// Обновление состояния кнопок
function updateButtonStates() {
    const tableSelect = document.getElementById('tableSelect');
    const createBtn = document.getElementById('createDataBtn');
    const generateBtn = document.getElementById('generateBtn');

    if (!tableSelect || !createBtn || !generateBtn) return;

    const isTableSelected = tableSelect.value !== '';
    const isTableAvailable = isTableSelected ? isTableAvailableForRole(tableSelect.value) : false;

    // Кнопка "Создать данные"
    createBtn.disabled = !isTableSelected || !isTableAvailable;
    createBtn.style.opacity = (isTableSelected && isTableAvailable) ? '1' : '0.5';
    createBtn.style.cursor = (isTableSelected && isTableAvailable) ? 'pointer' : 'not-allowed';

    if (isTableSelected && isTableAvailable) {
        createBtn.title = `Создать запись в таблице "${formatTableName(tableSelect.value)}"`;
    } else if (!isTableAvailable && isTableSelected) {
        createBtn.title = 'Нет доступа к этой таблице';
    } else {
        createBtn.title = 'Выберите таблицу для создания записей';
    }

    // Кнопка "Обновить данные"
    generateBtn.disabled = !isTableSelected || !isTableAvailable;
    generateBtn.style.opacity = (isTableSelected && isTableAvailable) ? '1' : '0.5';
    generateBtn.style.cursor = (isTableSelected && isTableAvailable) ? 'pointer' : 'not-allowed';

    if (isTableSelected && isTableAvailable) {
        generateBtn.title = `Обновить данные таблицы "${formatTableName(tableSelect.value)}"`;
    } else if (!isTableAvailable && isTableSelected) {
        generateBtn.title = 'Нет доступа к этой таблице';
    } else {
        generateBtn.title = 'Выберите таблицу для обновления данных';
    }
}

// Форматирование названия таблицы
function formatTableName(tableName) {
    const tableNames = {
        'equipment': 'Оборудование',
        'fuel': 'Топливо',
        'geyser': 'Газовые колонки',
        'users': 'Пользователи',
        'repair': 'Ремонты',
        'roles': 'Роли'
    };

    return tableNames[tableName] || tableName;
}

// Обработчик выбора таблицы
function onTableSelect() {
    const tableSelect = document.getElementById('tableSelect');

    console.log('📋 Выбрана таблица:', tableSelect.value);

    if (!tableSelect.value) {
        currentTable = '';
        clearTable();
        updateButtonStates();
        showNotification('Таблица не выбрана', 'info');
        return;
    }

    // Проверяем доступность таблицы
    if (!isTableAvailableForRole(tableSelect.value)) {
        showNotification('У вас нет доступа к этой таблице', 'error');
        tableSelect.value = '';
        currentTable = '';
        clearTable();
        updateButtonStates();
        return;
    }

    currentTable = tableSelect.value;
    currentFilters = {};
    sortColumn = '';
    sortDirection = 'asc';

    updateButtonStates();
    generateData();
}

// Проверка доступности таблицы для роли
function isTableAvailableForRole(tableName) {
    const isAdmin = api.isAdmin();

    if ((tableName === 'users' || tableName === 'roles') && !isAdmin) {
        return false;
    }

    return true;
}

// Обновление доступности таблиц
function updateTableSelectBasedOnRole() {
    const tableSelect = document.getElementById('tableSelect');
    if (!tableSelect) return;

    const isAdmin = api.isAdmin();
    const options = tableSelect.options;

    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const value = option.value;

        if (!value) continue;

        const isAvailable = isTableAvailableForRole(value);

        if (isAvailable) {
            option.style.display = 'block';
            option.disabled = false;
            option.classList.remove('hidden', 'admin-only');

            if (value === 'users' || value === 'roles') {
                option.classList.add('admin-only');
                option.title = 'Только для администраторов';
            }
        } else {
            option.style.display = 'none';
            option.disabled = true;
            option.classList.add('hidden');

            if (tableSelect.value === value) {
                tableSelect.value = '';
                currentTable = '';
                clearTable();
                showNotification('Доступ к этой таблице ограничен. Выберите другую таблицу.', 'warning');
            }
        }
    }

    updateButtonStates();
}

// ==================== ЗАГРУЗКА И ОТОБРАЖЕНИЕ ДАННЫХ ====================

// Загрузка и отображение данных таблицы
async function generateData() {
    if (!currentTable) {
        showNotification('Выберите таблицу для отображения данных', 'warning');
        return;
    }

    console.log(`🔄 Загрузка данных для таблицы: ${currentTable}`);

    const loading = document.getElementById('loading');
    const noData = document.getElementById('noData');
    const tableContainer = document.getElementById('dataTableContainer');

    loading.classList.add('active');
    noData.style.display = 'none';
    tableContainer.style.display = 'none';

    try {
        currentData = await api.getTableData(currentTable);
        console.log(`✅ Данные получены: ${currentData?.length || 0} записей`);

        if (!currentData || currentData.length === 0) {
            noData.textContent = 'В таблице нет данных';
            noData.style.display = 'block';
            tableContainer.style.display = 'none';
            showNotification('Данные не найдены', 'info');
        } else {
            if (Object.keys(currentFilters).length > 0) {
                currentData = applyFilters(currentData);
            }

            if (sortColumn) {
                currentData = sortData(currentData, sortColumn, sortDirection);
            }

            displayTableData(currentData);
            tableContainer.style.display = 'block';

            showNotification(`Загружено записей: ${currentData.length}`, 'success');
        }
    } catch (error) {
        console.error('❌ Ошибка при загрузке данных:', error);

        noData.textContent = 'Ошибка загрузки данных';
        if (error.message) {
            noData.innerHTML = `Ошибка загрузки данных:<br><small>${escapeHtml(error.message)}</small>`;
        }
        noData.style.display = 'block';

        let errorMessage = 'Ошибка при загрузке данных';
        if (error.status === 400) {
            errorMessage = 'Неверный запрос к серверу';
        } else if (error.status === 404) {
            errorMessage = 'Таблица не найдена';
        } else if (error.status === 405) {
            errorMessage = 'Метод не разрешен';
        } else if (error.status === 403) {
            errorMessage = 'Нет доступа к этой таблице';
        } else if (error.status === 401) {
            errorMessage = 'Требуется авторизация';
            api.logout();
            return;
        } else if (error.status === 500) {
            errorMessage = 'Внутренняя ошибка сервера';
        } else if (error.message && error.message.includes('подключиться к серверу')) {
            errorMessage = 'Не удалось подключиться к серверу. Проверьте подключение к интернету';
        }

        showNotification(`${errorMessage}`, 'error');
    } finally {
        loading.classList.remove('active');
    }
}

// Применение фильтров
function applyFilters(data) {
    if (!data || !Array.isArray(data)) return [];
    if (Object.keys(currentFilters).length === 0) return data;

    return data.filter(item => {
        return Object.entries(currentFilters).every(([key, filterValue]) => {
            const itemValue = item[key];
            if (itemValue === null || itemValue === undefined) return false;

            const itemStr = itemValue.toString().toLowerCase();
            const filterStr = filterValue.toString().toLowerCase();

            return itemStr.includes(filterStr);
        });
    });
}

// Сортировка данных
function sortData(data, column, direction) {
    if (!data || !Array.isArray(data)) return [];
    if (data.length === 0) return data;

    return [...data].sort((a, b) => {
        let aValue = a[column];
        let bValue = b[column];

        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';

        const aStr = aValue.toString().toLowerCase();
        const bStr = bValue.toString().toLowerCase();

        let comparison = 0;
        if (aStr > bStr) comparison = 1;
        if (aStr < bStr) comparison = -1;

        return direction === 'asc' ? comparison : -comparison;
    });
}

// Проверка, удалена ли запись
function isRecordDeleted(record) {
    if (!record || typeof record !== 'object') return false;

    const deleteFields = [
        'whenDeleted', 'WhenDeleted', 'dateDeleted', 'DateDeleted',
        'deletedAt', 'DeletedAt', 'isDeleted', 'IsDeleted', 'isdeleted'
    ];

    for (const field of deleteFields) {
        const value = record[field];

        if (value !== null && value !== undefined && value !== '') {
            if (typeof value === 'boolean') {
                return value === true;
            }
            return true;
        }
    }

    return false;
}

// ==================== ОТОБРАЖЕНИЕ ТАБЛИЦЫ ====================

// Отображение данных таблицы
function displayTableData(data) {
    console.log(`📋 Отображение данных таблицы: ${data.length} записей`);

    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');

    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    if (!data || data.length === 0) {
        return;
    }

    const firstItem = data[0];
    const headers = Object.keys(firstItem);

    const hiddenFields = getHiddenFieldsForRole();
    let displayHeaders = headers.filter(header =>
        !hiddenFields.includes(header.toLowerCase())
    );

    if (shouldHideIdColumns()) {
        displayHeaders = displayHeaders.filter(header => !isIdColumn(header));
    }

    displayHeaders = sortHeadersForAdmin(displayHeaders);

    const headerRow = document.createElement('tr');

    const numberTh = document.createElement('th');
    numberTh.textContent = '№';
    numberTh.style.width = '60px';
    numberTh.style.textAlign = 'center';
    numberTh.title = 'Порядковый номер';
    headerRow.appendChild(numberTh);

    displayHeaders.forEach((header) => {
        const th = document.createElement('th');
        th.textContent = formatHeader(header);
        th.style.cursor = 'pointer';
        th.title = 'Нажмите для сортировки';
        th.addEventListener('click', () => handleSortClick(header));

        if (api.isAdmin()) {
            const order = getServiceFieldOrder(header);
            const isServiceField = order < 999;

            if (isServiceField) {
                th.classList.add('admin-service-header');
                th.title = 'Служебное поле администратора';
            }

            if (isIdColumn(header)) {
                th.style.backgroundColor = '#fff0f0';
                th.style.color = '#990000';
                th.style.fontWeight = 'bold';
                th.title = 'ID поле';
            }
        }

        headerRow.appendChild(th);
    });

    const actionsTh = document.createElement('th');
    actionsTh.textContent = 'Действия';
    actionsTh.style.width = '180px';
    actionsTh.style.textAlign = 'center';
    actionsTh.title = 'Доступные действия с записью';
    headerRow.appendChild(actionsTh);

    tableHeader.appendChild(headerRow);

    data.forEach((row, rowIndex) => {
        const tableRow = document.createElement('tr');

        const isDeleted = isRecordDeleted(row);
        const isAdmin = api.isAdmin();

        if (!isAdmin && isDeleted) {
            return;
        }

        if (isAdmin && isDeleted) {
            tableRow.classList.add('admin-deleted-record');
            tableRow.style.backgroundColor = '#fff8f8';
            tableRow.style.borderLeft = '4px solid #ff6b6b';
            tableRow.style.opacity = '0.9';
        }

        const numberTd = document.createElement('td');
        numberTd.textContent = rowIndex + 1;
        numberTd.style.textAlign = 'center';
        numberTd.style.fontWeight = 'bold';
        numberTd.style.backgroundColor = isAdmin && isDeleted ? '#ffe6e6' : '#f8f9fa';

        if (isAdmin && isDeleted) {
            const indicator = document.createElement('span');
            indicator.className = 'deleted-indicator';
            indicator.textContent = 'Удалено';
            indicator.title = 'Эта запись помечена как удаленная';
            numberTd.appendChild(indicator);
        }

        tableRow.appendChild(numberTd);

        displayHeaders.forEach((header) => {
            const td = document.createElement('td');
            let value = row[header];
            value = escapeHtml(formatValue(value));
            td.textContent = value;

            if (api.isAdmin()) {
                const order = getServiceFieldOrder(header);
                const isId = isIdColumn(header);

                if (order === 1 || order === 2 || order === 6 || order === 7) {
                    td.classList.add('admin-service-field-date');
                    td.style.fontFamily = 'monospace';
                    td.style.fontSize = '12px';
                    td.style.color = '#0066cc';
                    td.style.backgroundColor = isDeleted ? '#ffe6e6' : '#f0f8ff';
                } else if (order === 3 || order === 4) {
                    td.classList.add('admin-service-field-user');
                    td.style.fontStyle = 'italic';
                    td.style.color = '#666';
                    td.style.backgroundColor = isDeleted ? '#ffe6e6' : '#f9f9f9';
                } else if (order === 5) {
                    td.classList.add('admin-service-field-delete');
                    td.style.fontFamily = 'monospace';
                    td.style.fontSize = '11px';
                    td.style.color = '#cc0000';
                    td.style.backgroundColor = '#fff0f0';
                    td.style.fontWeight = 'bold';

                    if (value !== '-' && value !== '') {
                        td.style.border = '2px solid #ff6b6b';
                        td.style.borderRadius = '4px';
                        td.style.padding = '2px 4px';
                    }
                } else if (isId) {
                    td.style.fontFamily = 'monospace';
                    td.style.backgroundColor = isDeleted ? '#ffe6e6' : '#fff0f0';
                    td.style.fontWeight = 'bold';
                    td.style.color = '#990000';
                } else if (order < 999) {
                    td.classList.add('admin-service-field');
                    td.style.fontFamily = 'monospace';
                    td.style.fontSize = '11px';
                    td.style.color = '#0066cc';
                    td.style.backgroundColor = isDeleted ? '#ffe6e6' : '#f0f8ff';
                }
            }

            tableRow.appendChild(td);
        });

        if (!isDeleted || isAdmin) {
            const actionsTd = document.createElement('td');
            actionsTd.className = 'actions-cell';
            actionsTd.style.textAlign = 'center';

            const viewBtn = createActionButton('👁', 'Просмотреть подробности', '#4CAF50');
            viewBtn.onclick = () => viewDetails(row, displayHeaders);
            actionsTd.appendChild(viewBtn);

            const editBtn = createActionButton('✏️', 'Редактировать запись', '#FF9800');
            editBtn.onclick = () => handleEditRecord(row);
            actionsTd.appendChild(editBtn);

            const actionBtnText = isAdmin && isDeleted ? '♻️' : '🗑️';
            const actionBtnTitle = isAdmin && isDeleted ? 'Восстановить запись' :
                isAdmin ? 'Пометить как удаленную' : 'Удалить запись';
            const actionBtnColor = isAdmin && isDeleted ? '#2196F3' :
                isAdmin ? '#ff9800' : '#f44336';

            const actionBtn = createActionButton(actionBtnText, actionBtnTitle, actionBtnColor);
            actionBtn.onclick = () => handleDeleteRestore(row);
            actionsTd.appendChild(actionBtn);

            tableRow.appendChild(actionsTd);
        }

        tableBody.appendChild(tableRow);
    });
}

// Обработка сортировки
function handleSortClick(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }

    currentData = sortData(currentData, sortColumn, sortDirection);
    displayTableData(currentData);

    showNotification(
        `Таблица отсортирована по "${formatHeader(column)}" (${sortDirection === 'asc' ? 'возрастание' : 'убывание'})`,
        'info'
    );
}

// Создание кнопки действия
function createActionButton(text, title, color) {
    const button = document.createElement('button');
    button.className = 'action-btn';
    button.textContent = text;
    button.title = title;
    button.style.backgroundColor = color;
    button.style.color = 'white';
    button.style.padding = '6px 12px';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';
    button.style.minWidth = '36px';
    button.style.margin = '2px';
    button.style.transition = 'all 0.2s';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';

    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.05)';
        button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    });

    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = 'none';
    });

    return button;
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ТАБЛИЦ ====================

// Получение скрытых полей
function getHiddenFieldsForRole() {
    const isAdmin = api.isAdmin();

    if (isAdmin) {
        return ['passwordHash', 'resetToken', 'resetTokenExpiry'];
    } else {
        return [
            'passwordHash', 'resetToken', 'resetTokenExpiry', 'password',
            'dateOfRecording', 'dateOfChange', 'whoRecorded',
            'whoChanged', 'whenDeleted', 'deletedAt', 'isDeleted',
            'Date_of_recording', 'Date_of_change', 'Who_recorded',
            'Who_changed', 'WhenDeleted',
            'date_of_recording', 'date_of_change', 'who_recorded',
            'who_changed', 'whendeleted',
            'createdAt', 'updatedAt', 'createdBy', 'updatedBy'
        ];
    }
}

// Проверка необходимости скрытия ID колонок
function shouldHideIdColumns() {
    return !api.isAdmin();
}

// Проверка, является ли поле ID
function isIdColumn(header) {
    if (!header) return false;
    const headerLower = header.toString().toLowerCase();

    const exceptions = ['idea', 'identity', 'idle', 'kid', 'solid', 'video', 'hide', 'mid'];

    if (exceptions.some(exception => headerLower.includes(exception))) {
        return false;
    }

    const idPatterns = ['^id$', '_id$', 'id_', '_id_'];
    return idPatterns.some(pattern => {
        const regex = new RegExp(pattern);
        return regex.test(headerLower);
    });
}

// Получение порядка служебных полей
function getServiceFieldOrder(header) {
    if (!header) return 999;

    const headerLower = header.toString().toLowerCase();
    const cleanHeader = headerLower.replace(/[^a-z]/g, '');

    const serviceOrder = {
        'daterecord': 1,
        'datechange': 2,
        'whorecord': 3,
        'whochange': 4,
        'whendelete': 5,
        'createdat': 6,
        'updatedat': 7
    };

    for (const [pattern, order] of Object.entries(serviceOrder)) {
        if (cleanHeader.includes(pattern)) {
            return order;
        }
    }

    if (cleanHeader.includes('date') && cleanHeader.includes('record')) return 1;
    if (cleanHeader.includes('date') && cleanHeader.includes('change')) return 2;
    if (cleanHeader.includes('who') && cleanHeader.includes('record')) return 3;
    if (cleanHeader.includes('who') && cleanHeader.includes('change')) return 4;
    if (cleanHeader.includes('when') && cleanHeader.includes('delete')) return 5;
    if (cleanHeader.includes('created')) return 6;
    if (cleanHeader.includes('updated')) return 7;

    return 999;
}

// Проверка, является ли поле только для чтения
function isReadOnlyServiceField(header) {
    const order = getServiceFieldOrder(header);
    return order >= 1 && order <= 5;
}

// Сортировка заголовков для администратора
function sortHeadersForAdmin(headers) {
    const isAdmin = api.isAdmin();

    if (!isAdmin || !headers || headers.length === 0) {
        return headers || [];
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

    return [...regularHeaders, ...sortedServiceHeaders];
}

// ==================== ОБЩАЯ ФОРМА ДЛЯ СОЗДАНИЯ И РЕДАКТИРОВАНИЯ ====================

// Показать модальное окно создания записи
function showCreateModal() {
    if (!currentTable) {
        showNotification('Сначала выберите таблицу', 'error');
        return;
    }

    console.log(`➕ Открытие формы создания для таблицы: ${currentTable}`);

    // Создаем пустую запись с правильной структурой
    const emptyRecord = createEmptyRecord();

    // Вызываем общую функцию формы в режиме создания
    showRecordModal(emptyRecord, true);
}

// Показать модальное окно редактирования записи
function handleEditRecord(record) {
    if (!record) {
        console.error('Не передана запись для редактирования');
        return;
    }

    console.log('✏️ Открытие формы редактирования записи');

    const isDeleted = isRecordDeleted(record);
    const isAdmin = api.isAdmin();

    if (isDeleted) {
        if (isAdmin) {
            if (!confirm('Эта запись удалена. Хотите восстановить и редактировать её?')) {
                return;
            }

            handleDeleteRestore(record);
            return;
        } else {
            showNotification('Нельзя редактировать удаленную запись', 'error');
            return;
        }
    }

    // Вызываем общую функцию формы в режиме редактирования
    showRecordModal(record, false);
}

// Общая функция для отображения формы записи (создание/редактирование)
function showRecordModal(record, isCreate = false) {
    // Создаем модальное окно, если его нет
    if (!document.getElementById('editModal')) {
        createEditModal();
    }

    const modal = document.getElementById('editModal');
    const modalContent = document.getElementById('editModalContent');

    if (!modal || !modalContent) {
        console.error('Не удалось найти элементы модального окна');
        showNotification('Ошибка при открытии формы', 'error');
        return;
    }

    const recordId = isCreate ? null : api.getRecordId(record);
    const isAdmin = api.isAdmin();
    const isDeleted = isCreate ? false : isRecordDeleted(record);
    const tableName = formatTableName(currentTable);

    // Определяем заголовок
    const title = isCreate ?
        `Создание новой записи в таблице "${tableName}"` :
        `Редактирование записи`;

    let html = `<h3>${title}</h3>`;

    if (!isCreate && isDeleted && isAdmin) {
        html += `<div class="admin-only-element" style="color: #ff6b6b;">
                    <strong>⚠️ Эта запись удалена</strong><br>
                    <small>Вы можете восстановить её, сняв отметку об удалении</small>
                 </div>`;
    }

    if (isAdmin) {
        html += `<div class="admin-only-element">
                    <small>👑 <strong>Режим администратора:</strong> вы видите все поля, включая служебные</small>
                 </div>`;
    }

    html += `<form id="recordForm" class="edit-form">`;

    // Определяем поля для формы
    let fields = [];
    if (isCreate) {
        // Для создания берем поля из существующих данных или используем типовые
        if (currentData && currentData.length > 0) {
            fields = Object.keys(currentData[0]);
        } else {
            fields = getDefaultFieldsForTable(currentTable);
        }
    } else {
        // Для редактирования берем поля из записи
        fields = Object.keys(record);
    }

    // Фильтруем поля в зависимости от роли
    const hiddenFields = getHiddenFieldsForRole();
    fields = fields.filter(key => !hiddenFields.includes(key.toLowerCase()));

    // Сортируем поля для администратора
    if (isAdmin) {
        fields = sortHeadersForAdmin(fields);
    }

    // Создаем поля формы
    fields.forEach(key => {
        // Определяем значение для поля
        let value = '';
        let fieldType = 'text';

        if (!isCreate) {
            value = record[key];
        }

        // Определяем тип поля на основе значения или имени поля
        if (typeof value === 'boolean') {
            fieldType = 'boolean';
        } else if (isDateColumn(key, value)) {
            fieldType = 'date';
        } else if (key.toLowerCase() === 'password') {
            fieldType = 'password';
        } else if (isIdColumn(key)) {
            fieldType = 'id';
        } else if (isReadOnlyServiceField(key)) {
            fieldType = 'readonly';
        }

        const label = escapeHtml(formatHeader(key));
        const inputId = `field_${key}`;
        const inputName = key;

        html += `<div class="form-group">`;
        html += `<label for="${inputId}">${label}:</label>`;

        switch (fieldType) {
            case 'boolean':
                const boolValue = value === true || value === 'true';
                html += `<select id="${inputId}" name="${inputName}" class="form-input">
                            <option value="true" ${boolValue ? 'selected' : ''}>Да</option>
                            <option value="false" ${!boolValue ? 'selected' : ''}>Нет</option>
                         </select>`;
                break;

            case 'date':
                const dateValue = formatDateForInput(value);
                html += `<input type="datetime-local" id="${inputId}" name="${inputName}" 
                               value="${dateValue}" class="form-input">`;
                break;

            case 'password':
                html += `<input type="password" id="${inputId}" name="${inputName}" 
                               placeholder="${isCreate ? 'Введите пароль' : 'Оставьте пустым, чтобы не менять'}" 
                               class="form-input" ${isCreate ? 'required' : ''}>`;
                if (!isCreate) {
                    html += `<small class="field-hint">Заполните только если хотите изменить пароль</small>`;
                }
                break;

            case 'id':
            case 'readonly':
                const displayValue = isCreate ? '' : escapeHtml(formatValueForInput(value));
                html += `<input type="text" id="${inputId}" name="${inputName}" 
                               value="${displayValue}" class="form-input" readonly>
                        <small class="readonly-note">${fieldType === 'id' ? 'ID нельзя изменить' : 'Это поле заполняется автоматически'}</small>`;
                break;

            default:
                const textValue = escapeHtml(formatValueForInput(value));
                html += `<input type="text" id="${inputId}" name="${inputName}" 
                               value="${textValue}" class="form-input" placeholder="Введите значение">`;
                break;
        }

        html += `</div>`;
    });

    // Кнопки формы
    const submitText = isCreate ? 'Создать запись' : 'Сохранить изменения';
    const submitIcon = isCreate ? '➕' : '💾';

    html += `<div class="modal-actions">
                <button type="submit" class="btn btn-primary">
                    <span class="btn-icon">${submitIcon}</span> ${submitText}
                </button>
                <button type="button" class="btn btn-secondary" onclick="closeEditModal()">
                    <span class="btn-icon">×</span> Отмена
                </button>
             </div>`;

    html += '</form>';

    modalContent.innerHTML = html;
    modal.style.display = 'flex';

    // Настраиваем обработчик формы
    const form = document.getElementById('recordForm');
    if (form) {
        form.onsubmit = async function (e) {
            e.preventDefault();
            if (isCreate) {
                await submitCreateForm(form);
            } else {
                await submitEditForm(recordId, form);
            }
        };
    }

    console.log(`✅ Форма ${isCreate ? 'создания' : 'редактирования'} отображена`);
}

// Создание пустой записи с правильной структурой
function createEmptyRecord() {
    const emptyRecord = {};

    // Определяем поля на основе существующих данных
    if (currentData && currentData.length > 0) {
        const sampleRecord = currentData[0];

        for (const key in sampleRecord) {
            const value = sampleRecord[key];

            if (typeof value === 'boolean') {
                emptyRecord[key] = false;
            } else if (typeof value === 'number') {
                emptyRecord[key] = 0;
            } else if (isDateColumn(key, value)) {
                emptyRecord[key] = '';
            } else if (key.toLowerCase() === 'password') {
                emptyRecord[key] = '';
            } else if (isIdColumn(key)) {
                // ID поля оставляем пустыми - они сгенерируются на сервере
                emptyRecord[key] = '';
            } else if (isReadOnlyServiceField(key)) {
                // Служебные поля оставляем пустыми
                emptyRecord[key] = '';
            } else {
                emptyRecord[key] = '';
            }
        }
    } else {
        // Используем типовые поля
        const fields = getDefaultFieldsForTable(currentTable);
        fields.forEach(key => {
            emptyRecord[key] = '';
        });
    }

    return emptyRecord;
}

// Получение типовых полей для таблицы
function getDefaultFieldsForTable(tableName) {
    const defaultFields = {
        'equipment': ['name', 'type', 'brand', 'status', 'location', 'lastMaintenance'],
        'fuel': ['name', 'type', 'quantity', 'unit', 'price', 'supplier'],
        'geyser': ['name', 'type', 'status', 'location', 'manufacturer'],
        'users': ['username', 'email', 'password', 'role', 'isActive'],
        'repair': ['equipmentId', 'description', 'status', 'cost', 'dateOfRepair'],
        'roles': ['name', 'permissions', 'description']
    };

    return defaultFields[tableName] || ['name', 'description'];
}

// Проверка, является ли поле датой
function isDateColumn(key, value) {
    if (!value) {
        // Проверяем по названию поля
        const dateFields = ['date', 'created', 'updated', 'deleted', 'lastlogin', 'when', 'at'];
        return dateFields.some(field => key.toLowerCase().includes(field));
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
    const dateFields = ['date', 'created', 'updated', 'deleted', 'lastlogin', 'when', 'at'];

    const isDateString = typeof value === 'string' && dateRegex.test(value);
    const hasDateInName = dateFields.some(field => key.toLowerCase().includes(field));

    return isDateString || hasDateInName;
}

// Форматирование даты для input
function formatDateForInput(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().slice(0, 16);
    } catch (e) {
        return '';
    }
}

// Форматирование значения для input
function formatValueForInput(value) {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }

    if (typeof value === 'number') {
        return value.toString();
    }

    return value.toString();
}

// Создание модального окна
function createEditModal() {
    console.log('🛠️ Создание модального окна...');

    const modal = document.createElement('div');
    modal.id = 'editModal';
    modal.className = 'modal';

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" title="Закрыть">&times;</span>
            <div id="editModalContent"></div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeEditModal();
        }
    });

    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeEditModal);
    }

    return modal;
}

// Закрытие модального окна редактирования
function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.style.display = 'none';
        const modalContent = document.getElementById('editModalContent');
        if (modalContent) {
            modalContent.innerHTML = '';
        }
    }
}

// ==================== ОТПРАВКА ФОРМ ====================

// Отправка формы создания
async function submitCreateForm(form) {
    try {
        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            if (value !== '') {
                data[key] = value;
            }
        }

        console.log('📤 Отправка данных для создания:', data);

        // Проверяем обязательные поля
        if (!validateFormData(data, 'create')) {
            return;
        }

        // Отправляем запрос
        const result = await api.createRecord(currentTable, data);
        console.log('✅ Результат создания записи:', result);

        // Обработка результата
        if (result) {
            if (result.localCreate || result.local) {
                showNotification(result.message || 'Запись создана локально', 'info');

                if (result.data) {
                    currentData.push(result.data);
                    displayTableData(currentData);
                    showNotification('Запись добавлена в таблицу', 'success');
                }
            } else {
                showNotification('Запись успешно создана', 'success');
                await generateData();
            }
        } else {
            showNotification('Запись создана', 'success');
            await generateData();
        }

        closeEditModal();

    } catch (error) {
        console.error('❌ Ошибка при создании записи:', error);

        let errorMessage = 'Ошибка при создании записи';
        if (error.status === 400) {
            errorMessage = 'Неверные данные. Проверьте введенные значения.';
        } else if (error.status === 403) {
            errorMessage = 'У вас нет прав на создание записи.';
        } else if (error.status === 409) {
            errorMessage = 'Запись с такими данными уже существует.';
        } else if (error.status === 500) {
            errorMessage = 'Ошибка сервера при создании записи.';
        } else if (error.message && error.message.includes('подключиться к серверу')) {
            errorMessage = 'Не удалось подключиться к серверу. Проверьте подключение к интернету.';
        }

        showNotification(`${errorMessage}: ${error.message || 'Неизвестная ошибка'}`, 'error');
    }
}

// Отправка формы редактирования
async function submitEditForm(recordId, form) {
    try {
        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            const input = form.querySelector(`[name="${key}"]`);
            if (input && (input.readOnly || input.disabled)) {
                continue;
            }

            if (key.toLowerCase() === 'password' && value === '') {
                continue;
            }

            data[key] = value;
        }

        console.log('📤 Отправка данных для редактирования:', data);

        // Проверяем обязательные поля
        if (!validateFormData(data, 'edit')) {
            return;
        }

        // Отправляем запрос
        const result = await api.updateRecord(currentTable, recordId, data);
        console.log('✅ Результат обновления записи:', result);

        // Обработка результата
        if (result) {
            if (result.localUpdate || result.local) {
                showNotification(result.message || 'Запись обновлена локально', 'info');

                const index = currentData.findIndex(item => api.getRecordId(item) === recordId);
                if (index !== -1) {
                    currentData[index] = { ...currentData[index], ...data };
                    displayTableData(currentData);
                }
            } else {
                showNotification('Запись успешно обновлена', 'success');
                await generateData();
            }
        } else {
            showNotification('Запись обновлена', 'success');
            await generateData();
        }

        closeEditModal();

    } catch (error) {
        console.error('❌ Ошибка при обновлении записи:', error);

        let errorMessage = 'Ошибка при обновлении записи';
        if (error.status === 400) {
            errorMessage = 'Неверные данные. Проверьте введенные значения.';
        } else if (error.status === 404) {
            errorMessage = 'Запись не найдена на сервере.';
        } else if (error.status === 403) {
            errorMessage = 'У вас нет прав на редактирование этой записи.';
        } else if (error.status === 500) {
            errorMessage = 'Ошибка сервера при сохранении изменений.';
        } else if (error.message && error.message.includes('подключиться к серверу')) {
            errorMessage = 'Не удалось подключиться к серверу. Проверьте подключение к интернету.';
        }

        showNotification(`${errorMessage}: ${error.message || 'Неизвестная ошибка'}`, 'error');
    }
}

// Валидация данных формы
function validateFormData(data, action = 'create') {
    const requiredFields = ['name', 'username', 'email'];
    for (const field of requiredFields) {
        if (data[field] === '' || data[field] === undefined) {
            showNotification(`Поле "${formatHeader(field)}" обязательно для заполнения`, 'error');
            return false;
        }
    }

    if (data.email && !isValidEmail(data.email)) {
        showNotification('Некорректный формат email', 'error');
        return false;
    }

    if (data.password && data.password.length < 6) {
        showNotification('Пароль должен содержать не менее 6 символов', 'error');
        return false;
    }

    return true;
}

// Проверка email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ==================== УДАЛЕНИЕ И ВОССТАНОВЛЕНИЕ ====================

// Обработка удаления/восстановления записи
async function handleDeleteRestore(record) {
    try {
        const recordId = api.getRecordId(record);
        const isAdmin = api.isAdmin();
        const isDeleted = isRecordDeleted(record);

        if (isAdmin && isDeleted) {
            if (confirm('Восстановить эту запись?')) {
                const result = await api.restoreRecord(currentTable, recordId);

                if (result) {
                    if (result.localRestore || result.local) {
                        showNotification(result.message || 'Запись восстановлена локально', 'info');

                        const index = currentData.findIndex(item => api.getRecordId(item) === recordId);
                        if (index !== -1) {
                            delete currentData[index].isDeleted;
                            delete currentData[index].IsDeleted;
                            delete currentData[index].deletedAt;
                            delete currentData[index].DeletedAt;
                            delete currentData[index].whenDeleted;
                            delete currentData[index].WhenDeleted;

                            displayTableData(currentData);
                        }
                    } else {
                        showNotification('Запись восстановлена', 'success');
                        await generateData();
                    }
                } else {
                    showNotification('Запись восстановлена', 'success');
                    await generateData();
                }
            }
        } else {
            let message = isAdmin ?
                'Пометить запись как удаленную (мягкое удаление)?' :
                'Удалить эту запись?';

            if (confirm(message)) {
                const result = await api.deleteRecord(currentTable, recordId);

                if (result) {
                    if (result.localDelete || result.local) {
                        showNotification(result.message || 'Запись удалена локально', 'info');

                        if (isAdmin) {
                            const index = currentData.findIndex(item => api.getRecordId(item) === recordId);
                            if (index !== -1) {
                                currentData[index].isDeleted = true;
                                currentData[index].deletedAt = new Date().toISOString();
                                displayTableData(currentData);
                            }
                        } else {
                            const index = currentData.findIndex(item => api.getRecordId(item) === recordId);
                            if (index !== -1) {
                                currentData.splice(index, 1);
                                displayTableData(currentData);
                            }
                        }
                    } else {
                        showNotification(isAdmin ? 'Запись помечена как удаленная' : 'Запись удалена', 'success');
                        await generateData();
                    }
                } else {
                    showNotification(isAdmin ? 'Запись помечена как удаленная' : 'Запись удалена', 'success');
                    await generateData();
                }
            }
        }
    } catch (error) {
        console.error('❌ Ошибка в handleDeleteRestore:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}

// ==================== ПРОСМОТР ДЕТАЛЕЙ ====================

// Просмотр детальной информации
function viewDetails(data, displayHeaders = null) {
    const modal = document.getElementById('detailsModal');
    const modalContent = document.getElementById('modalContent');

    if (!modal || !modalContent) return;

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

    const isDeleted = isRecordDeleted(data);
    const isAdmin = api.isAdmin();

    let html = '<h3>Подробная информация</h3>';

    if (isDeleted && isAdmin) {
        html += `<div class="deleted-warning">
                    <strong>⚠️ Эта запись удалена</strong><br>
                    <small>Видна только администраторам</small>
                 </div>`;
    }

    html += '<div class="details-container">';

    fieldsToShow.forEach(key => {
        let value = data[key];
        value = escapeHtml(formatValue(value));

        const order = getServiceFieldOrder(key);
        const isService = order < 999;
        const isId = isIdColumn(key);

        html += `
            <div class="detail-row">
                <span class="detail-label ${isService || isId ? 'admin-label' : ''}">
                    ${isId ? '🆔 ' : ''}${escapeHtml(formatHeader(key))}:
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

// Закрытие модального окна просмотра
function closeModal() {
    const modal = document.getElementById('detailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// Очистка таблицы
function clearTable() {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    const tableContainer = document.getElementById('dataTableContainer');
    const noData = document.getElementById('noData');

    if (tableHeader) tableHeader.innerHTML = '';
    if (tableBody) tableBody.innerHTML = '';
    if (tableContainer) tableContainer.style.display = 'none';
    if (noData) {
        noData.textContent = 'Выберите таблицу для отображения данных';
        noData.style.display = 'block';
    }

    currentData = [];
    currentFilters = {};
    sortColumn = '';
    sortDirection = 'asc';
}

// Показ уведомления
function showNotification(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    notification.innerHTML = `${icon} ${message}`;
    notification.title = 'Нажмите для закрытия';

    document.body.appendChild(notification);

    const autoHide = setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);

    notification.addEventListener('click', () => {
        clearTimeout(autoHide);
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    });
}

// Экранирование HTML
function escapeHtml(text) {
    if (typeof text !== 'string') return text;

    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}

// Форматирование значения для отображения
function formatValue(value) {
    if (value === null || value === undefined) {
        return '-';
    }

    if (typeof value === 'boolean') {
        return value ? '✅ Да' : '❌ Нет';
    }

    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return value.toLocaleString('ru-RU');
        } else {
            if (Math.abs(value) > 1000) {
                return value.toFixed(2).replace('.', ',') + ' ₽';
            }
            return value.toFixed(2).replace('.', ',');
        }
    }

    if (typeof value === 'string') {
        const dateRegex = /^\d{4}-\d{2}-\d{2}/;
        if (dateRegex.test(value)) {
            try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    if (value.includes('T') && value.length > 10) {
                        return date.toLocaleDateString('ru-RU') + ' ' +
                            date.toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            });
                    }
                    return date.toLocaleDateString('ru-RU');
                }
            } catch (e) { }
        }
        return value;
    }

    if (Array.isArray(value)) {
        return value.join(', ');
    }

    if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
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
        'isactive': 'Активен',
        'dateofrecording': 'Когда создали',
        'date_of_recording': 'Когда создали',
        'Date_of_recording': 'Когда создали',
        'dateofchange': 'Когда изменили',
        'date_of_change': 'Когда изменили',
        'Date_of_change': 'Когда изменили',
        'whorecorded': 'Кто создал',
        'who_recorded': 'Кто создал',
        'Who_recorded': 'Кто создал',
        'whochanged': 'Кто изменил',
        'who_changed': 'Кто изменил',
        'Who_changed': 'Кто изменил',
        'whendeleted': 'Когда удалено',
        'WhenDeleted': 'Когда удалено',
        'deletedat': 'Дата удаления',
        'isdeleted': 'Удалено',
        'recordedby': 'Записано',
        'changedby': 'Изменено',
        'createdby': 'Создал',
        'modifiedby': 'Изменил',
        'deletedby': 'Удалил',
        'createdat': 'Создано',
        'updatedat': 'Обновлено'
    };

    const lowerHeader = header.toLowerCase();

    if (translations[header]) {
        return translations[header];
    }

    if (translations[lowerHeader]) {
        return translations[lowerHeader];
    }

    const words = header
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .trim()
        .split(' ')
        .map(word => {
            if (word === word.toUpperCase() && word.length <= 3) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        });

    return words.join(' ');
}

// ==================== СТРАНИЦА СТАТИСТИКИ ====================

// Переход на страницу статистики
function showStatisticsPage() {
    if (!api.canViewStatistics()) {
        showNotification('Доступ к статистике только для администраторов и менеджеров', 'error');
        return;
    }

    window.location.href = 'statistics.html';
}

// Обновление данных
function refreshData() {
    generateData();
}

// ==================== ЭКСПОРТ ФУНКЦИЙ ====================

window.showStatisticsPage = showStatisticsPage;
window.logout = handleLogout;
window.onTableSelect = onTableSelect;
window.generateData = generateData;
window.refreshData = refreshData;
window.viewDetails = viewDetails;
window.closeModal = closeModal;
window.closeEditModal = closeEditModal;
window.handleEditRecord = handleEditRecord;
window.showCreateModal = showCreateModal;

console.log('🎉 Файл dashboard.js загружен и готов к работе!');
// Глобальные переменные
let currentTable = '';
let currentData = [];
let currentFilters = {};
let sortColumn = '';
let sortDirection = 'asc';

// Основная функция инициализации при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    setupEventListeners();
    initDashboard();
    updateUserInfo();
});

// Инициализация панели управления
function initDashboard() {
    clearTable();
    updateTableSelectBasedOnRole();
    updateButtonStates();
}

// Проверка авторизации пользователя
async function checkAuth() {
    const token = localStorage.getItem('authToken');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Проверяем валидность токена через API
        await api.request('/auth/validate');
    } catch (error) {
        if (error.status === 401) {
            api.logout();
            return;
        }
    }

    updateUserInfo();
    manageStatisticsButton();
    updateTableSelectBasedOnRole();
}

// Обновление информации о пользователе в интерфейсе
function updateUserInfo() {
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');

    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');

    if (userNameElement && userName) {
        userNameElement.textContent = userName;
    }

    if (userRoleElement && userRole) {
        userRoleElement.textContent = formatDisplayRole(userRole);
    }

    // Показываем индикатор администратора
    showAdminIndicator();
}

// Форматирование роли для отображения
function formatDisplayRole(role) {
    if (!role) return 'Пользователь';

    const roleLower = role.toString().toLowerCase().trim();

    const roleMap = {
        'admin': 'Администратор',
        'админ': 'Администратор',
        'administrator': 'Администратор',
        'manager': 'Менеджер',
        'менеджер': 'Менеджер',
        'user': 'Пользователь',
        'пользователь': 'Пользователь',
        'operator': 'Оператор',
        'оператор': 'Оператор',
        'technician': 'Техник',
        'техник': 'Техник',
        'supervisor': 'Супервайзер',
        'супервайзер': 'Супервайзер'
    };

    for (const [key, value] of Object.entries(roleMap)) {
        if (roleLower.includes(key)) {
            return value;
        }
    }

    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка выхода
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
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

    // Закрытие модальных окон по кнопке
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function () {
            const modal = this.closest('.modal');
            if (modal.id === 'detailsModal') {
                closeModal();
            } else if (modal.id === 'editModal') {
                closeEditModal();
            }
        });
    });

    // Обработка клавиши Escape для закрытия модальных окон
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeModal();
            closeEditModal();
        }
    });
}

// Выход из системы
function logout() {
    if (confirm('Вы уверены, что хотите выйти из системы?')) {
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

        // Добавляем специальные стили в зависимости от роли
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

// Обновление состояния кнопок
function updateButtonStates() {
    const tableSelect = document.getElementById('tableSelect');
    const createBtn = document.getElementById('createDataBtn');
    const generateBtn = document.getElementById('generateBtn');

    if (!tableSelect || !createBtn || !generateBtn) return;

    const isTableSelected = tableSelect.value !== '';

    // Кнопка "Создать данные"
    createBtn.disabled = !isTableSelected;
    createBtn.style.opacity = isTableSelected ? '1' : '0.5';
    createBtn.style.cursor = isTableSelected ? 'pointer' : 'not-allowed';
    createBtn.title = isTableSelected ?
        `Создать запись в таблице "${formatTableName(tableSelect.value)}"` :
        'Выберите таблицу для создания записей';

    // Кнопка "Обновить данные"
    generateBtn.disabled = !isTableSelected;
    generateBtn.style.opacity = isTableSelected ? '1' : '0.5';
    generateBtn.style.cursor = isTableSelected ? 'pointer' : 'not-allowed';
    generateBtn.title = isTableSelected ?
        `Обновить данные таблицы "${formatTableName(tableSelect.value)}"` :
        'Выберите таблицу для обновления данных';

    // Обновляем состояние таблицы выбора
    updateTableSelectBasedOnRole();
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

    if (!tableSelect.value) {
        currentTable = '';
        clearTable();
        updateButtonStates();
        return;
    }

    // Проверяем доступность таблицы для текущей роли
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

    // Только администраторы могут видеть таблицы пользователей и ролей
    if ((tableName === 'users' || tableName === 'roles') && !isAdmin) {
        return false;
    }

    return true;
}

// Обновление доступности таблиц в зависимости от роли
function updateTableSelectBasedOnRole() {
    const tableSelect = document.getElementById('tableSelect');
    if (!tableSelect) return;

    const isAdmin = api.isAdmin();
    const options = tableSelect.options;

    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const value = option.value;

        if (value === '' || value === 'equipment' || value === 'fuel' || value === 'geyser' || value === 'repair') {
            // Эти таблицы доступны всем
            option.style.display = 'block';
            option.disabled = false;
            option.classList.remove('hidden', 'admin-only');
        } else if (value === 'users' || value === 'roles') {
            // Эти таблицы только для администраторов
            if (isAdmin) {
                option.style.display = 'block';
                option.disabled = false;
                option.classList.remove('hidden');
                option.classList.add('admin-only');
            } else {
                option.style.display = 'none';
                option.disabled = true;
                option.classList.add('hidden');

                // Если эта таблица была выбрана, сбрасываем выбор
                if (tableSelect.value === value) {
                    tableSelect.value = '';
                    currentTable = '';
                    clearTable();
                    showNotification('Доступ к этой таблице ограничен. Выберите другую таблицу.', 'warning');
                }
            }
        }
    }

    updateButtonStates();
}

// Загрузка и отображение данных таблицы
async function generateData() {
    if (!currentTable) {
        showNotification('Выберите таблицу для отображения данных', 'warning');
        return;
    }

    const loading = document.getElementById('loading');
    const noData = document.getElementById('noData');
    const tableContainer = document.getElementById('dataTableContainer');

    loading.classList.add('active');
    noData.style.display = 'none';
    tableContainer.style.display = 'none';

    try {
        console.log(`🔄 Загрузка данных для таблицы: ${currentTable}`);
        currentData = await api.getTableData(currentTable);
        console.log(`✅ Данные получены: ${currentData?.length || 0} записей`);

        // Применяем фильтры, если они есть
        if (Object.keys(currentFilters).length > 0) {
            currentData = applyFilters(currentData);
        }

        // Применяем сортировку, если она есть
        if (sortColumn) {
            currentData = sortData(currentData, sortColumn, sortDirection);
        }

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
        console.error('❌ Ошибка при загрузке данных:', error);
        noData.textContent = 'Ошибка загрузки данных: ' + (error.message || 'Неизвестная ошибка');
        noData.style.display = 'block';

        let errorMessage = 'Ошибка при загрузке данных';
        if (error.status === 400) {
            errorMessage = 'Неверный запрос к серверу.';
        } else if (error.status === 404) {
            errorMessage = 'Таблица не найдена.';
        } else if (error.status === 405) {
            errorMessage = 'Метод не разрешен.';
        } else if (error.status === 403) {
            errorMessage = 'Нет доступа к этой таблице.';
        } else if (error.status === 500) {
            errorMessage = 'Внутренняя ошибка сервера.';
        } else if (error.message.includes('подключиться к серверу')) {
            errorMessage = 'Не удалось подключиться к серверу. Проверьте подключение к интернету.';
        }

        showNotification(`${errorMessage} (${error.status || 'нет статуса'})`, 'error');
    } finally {
        loading.classList.remove('active');
    }
}

// Применение фильтров к данным
function applyFilters(data) {
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
    return [...data].sort((a, b) => {
        let aValue = a[column];
        let bValue = b[column];

        // Обработка null/undefined
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';

        // Приведение к строке для сравнения
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
            // Если это строка или число (например, дата удаления)
            return true;
        }
    }

    return false;
}

// Получение скрытых полей для текущей роли
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

// Проверка, является ли поле ID-полем
function isIdColumn(header) {
    if (!header) return false;
    const headerLower = header.toString().toLowerCase();

    // Исключаем слова, которые содержат "id" но не являются ID-полями
    const exceptions = ['idea', 'identity', 'idle', 'kid', 'solid', 'video'];

    if (exceptions.some(exception => headerLower.includes(exception))) {
        return false;
    }

    // Проверяем на наличие "id" как отдельного слова или в составе
    const idPatterns = ['^id$', '_id$', 'id_', '_id_'];
    return idPatterns.some(pattern => {
        const regex = new RegExp(pattern);
        return regex.test(headerLower);
    });
}

// Проверка, является ли поле служебным
function isServiceColumn(header) {
    if (!header) return false;
    const headerLower = header.toString().toLowerCase();

    const serviceKeywords = [
        'record', 'change', 'who', 'when', 'delete',
        'created', 'updated', 'modified', 'by', 'dateof', 'ofrecording',
        'ofchange', 'whorecorded', 'whochanged', 'whendeleted'
    ];

    return serviceKeywords.some(keyword => headerLower.includes(keyword));
}

// Получение порядка сортировки служебных полей
function getServiceFieldOrder(header) {
    if (!header) return 999;

    const headerLower = header.toString().toLowerCase();
    const cleanHeader = headerLower.replace(/[^a-z]/g, '');

    if (cleanHeader.includes('daterecord') || cleanHeader.includes('recorddate') || cleanHeader.includes('dateofrecord')) {
        return 1;
    } else if (cleanHeader.includes('datechange') || cleanHeader.includes('changedate') || cleanHeader.includes('dateofchange')) {
        return 2;
    } else if (cleanHeader.includes('whorecord') || cleanHeader.includes('recordwho')) {
        return 3;
    } else if (cleanHeader.includes('whochange') || cleanHeader.includes('changewho')) {
        return 4;
    } else if (cleanHeader.includes('whendelete') || cleanHeader.includes('deletewhen')) {
        return 5;
    } else if (cleanHeader.includes('createdat') || cleanHeader.includes('createddate') || cleanHeader.includes('datecreated')) {
        return 6;
    } else if (cleanHeader.includes('updatedat') || cleanHeader.includes('updateddate') || cleanHeader.includes('dateupdated')) {
        return 7;
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
    } else if (cleanHeader.includes('created')) {
        return 6;
    } else if (cleanHeader.includes('updated')) {
        return 7;
    }

    return 999;
}

// Проверка, является ли поле только для чтения
function isReadOnlyServiceField(header) {
    const order = getServiceFieldOrder(header);
    // Поля с порядком 1-5 (Когда создали, Когда изменили, Кто создал, Кто изменил, Когда удалено) должны быть только для чтения
    return order >= 1 && order <= 5;
}

// Сортировка заголовков для администратора
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

    return [...regularHeaders, ...sortedServiceHeaders];
}

// Отображение данных таблицы
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

    const hiddenFields = getHiddenFieldsForRole();
    let displayHeaders = headers.filter(header =>
        !hiddenFields.includes(header.toLowerCase())
    );

    // Скрываем ID колонки для не-администраторов
    if (shouldHideIdColumns()) {
        const beforeFilterCount = displayHeaders.length;
        displayHeaders = displayHeaders.filter(header => !isIdColumn(header));
        console.log(`🆔 Отфильтровано ID полей: ${beforeFilterCount - displayHeaders.length}`);
    }

    // Сортируем заголовки для администратора
    displayHeaders = sortHeadersForAdmin(displayHeaders);

    // Создаем строку заголовков
    const headerRow = document.createElement('tr');

    // Колонка с номером
    const numberTh = document.createElement('th');
    numberTh.textContent = '№';
    numberTh.style.width = '60px';
    numberTh.style.textAlign = 'center';
    numberTh.style.cursor = 'pointer';
    numberTh.title = 'Нажмите для сортировки';
    numberTh.addEventListener('click', () => sortTable('number'));
    headerRow.appendChild(numberTh);

    // Заголовки столбцов
    displayHeaders.forEach((header, index) => {
        const th = document.createElement('th');
        th.textContent = formatHeader(header);
        th.style.cursor = 'pointer';
        th.title = 'Нажмите для сортировки';
        th.addEventListener('click', () => sortTable(header));

        const order = getServiceFieldOrder(header);
        const isServiceField = order < 999;

        if (api.isAdmin() && isServiceField) {
            th.classList.add('admin-service-header');
            th.title = 'Служебное поле администратора';
        }

        if (api.isAdmin() && isIdColumn(header)) {
            th.style.backgroundColor = '#fff0f0';
            th.style.color = '#990000';
            th.style.fontWeight = 'bold';
            th.title = 'ID поле';
        }

        headerRow.appendChild(th);
    });

    // Колонка действий
    const actionsTh = document.createElement('th');
    actionsTh.textContent = 'Действия';
    actionsTh.style.width = '200px';
    actionsTh.style.textAlign = 'center';
    headerRow.appendChild(actionsTh);

    tableHeader.appendChild(headerRow);

    // Заполняем строки данными
    data.forEach((row, rowIndex) => {
        const tableRow = document.createElement('tr');

        const isDeleted = isRecordDeleted(row);
        const isAdmin = api.isAdmin();

        // Скрываем удаленные записи для не-администраторов
        if (!isAdmin && isDeleted) {
            return;
        }

        // Стили для удаленных записей (только для администраторов)
        if (isAdmin && isDeleted) {
            tableRow.classList.add('admin-deleted-record');
            tableRow.style.backgroundColor = '#fff8f8';
            tableRow.style.borderLeft = '4px solid #ff6b6b';
            tableRow.style.opacity = '0.9';
        }

        // Колонка с номером
        const numberTd = document.createElement('td');
        numberTd.textContent = rowIndex + 1;
        numberTd.style.textAlign = 'center';
        numberTd.style.fontWeight = 'bold';
        numberTd.style.backgroundColor = isAdmin && isDeleted ? '#ffe6e6' : '#f8f9fa';

        if (isAdmin && isDeleted) {
            const indicator = document.createElement('span');
            indicator.className = 'deleted-indicator';
            indicator.textContent = 'Удалено';
            numberTd.appendChild(indicator);
        }

        tableRow.appendChild(numberTd);

        // Данные строки
        displayHeaders.forEach((header, colIndex) => {
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

        // Колонка действий
        const actionsTd = document.createElement('td');
        actionsTd.className = 'actions-cell';
        actionsTd.style.textAlign = 'center';

        // Кнопка просмотра
        const viewBtn = createActionButton('👁', 'Просмотреть подробности', '#4CAF50');
        viewBtn.onclick = () => viewDetails(row, displayHeaders);
        actionsTd.appendChild(viewBtn);

        // Кнопка редактирования (не показываем для удаленных записей у обычных пользователей)
        if (!isDeleted || isAdmin) {
            const editBtn = createActionButton('✏️', 'Редактировать запись', '#FF9800');
            editBtn.onclick = () => handleEditRecord(row);
            actionsTd.appendChild(editBtn);
        }

        // Кнопка удаления/восстановления
        const actionBtn = createActionButton(
            isAdmin && isDeleted ? '♻️' : '🗑️',
            isAdmin && isDeleted ? 'Восстановить запись' :
                isAdmin ? 'Пометить как удаленную' : 'Удалить запись',
            isAdmin && isDeleted ? '#2196F3' :
                isAdmin ? '#ff9800' : '#f44336'
        );
        actionBtn.onclick = () => handleDeleteRestore(row);
        actionsTd.appendChild(actionBtn);

        tableRow.appendChild(actionsTd);
        tableBody.appendChild(tableRow);
    });
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
    button.style.minWidth = '40px';
    button.style.margin = '2px';
    button.style.transition = 'all 0.2s';

    button.onmouseenter = () => {
        button.style.transform = 'scale(1.05)';
        button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    };

    button.onmouseleave = () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = 'none';
    };

    return button;
}

// Сортировка таблицы
function sortTable(column) {
    if (column === 'number') {
        // Сортировка по номеру - просто переворачиваем массив
        currentData.reverse();
    } else {
        if (sortColumn === column) {
            // Меняем направление сортировки
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // Новая колонка для сортировки
            sortColumn = column;
            sortDirection = 'asc';
        }

        currentData = sortData(currentData, sortColumn, sortDirection);
    }

    displayTableData(currentData);
    showNotification(`Таблица отсортирована по столбцу "${formatHeader(column)}" (${sortDirection === 'asc' ? 'возрастание' : 'убывание'})`, 'info');
}

// Показать модальное окно создания записи
function showCreateModal() {
    if (!currentTable) {
        showNotification('Сначала выберите таблицу', 'error');
        return;
    }

    // Создаем модальное окно, если его нет
    if (!document.getElementById('editModal')) {
        createEditModal();
    }

    const modal = document.getElementById('editModal');
    const modalContent = document.getElementById('editModalContent');

    if (!modal || !modalContent) {
        console.error('Не удалось найти элементы модального окна редактирования');
        showNotification('Ошибка при открытии окна создания', 'error');
        return;
    }

    const isAdmin = api.isAdmin();
    const tableName = formatTableName(currentTable);

    let html = `<h3>Создание новой записи в таблице "${tableName}"</h3>`;

    // Добавляем информацию о доступных полях для администратора
    if (isAdmin) {
        html += `<div class="admin-only-element">
                    <small>Режим администратора: вы видите все поля, включая служебные</small>
                 </div>`;
    }

    html += '<form id="createForm" class="edit-form">';

    // Определяем поля для формы на основе структуры таблицы
    const sampleRecord = currentData && currentData.length > 0 ? currentData[0] : {};
    let fields = Object.keys(sampleRecord);

    // Для новых таблиц используем типовые поля
    if (fields.length === 0) {
        fields = getDefaultFieldsForTable(currentTable);
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
        const label = escapeHtml(formatHeader(key));
        const isReadOnlyService = isReadOnlyServiceField(key);
        const isIdField = isIdColumn(key);
        const sampleValue = sampleRecord[key];
        const isPasswordField = key.toLowerCase() === 'password';
        const isBooleanField = typeof sampleValue === 'boolean';
        const isDateField = isDateColumn(key, sampleValue);

        html += `<div class="form-group">`;
        html += `<label for="${escapeHtml(key)}">${label}:</label>`;

        if (isReadOnlyService || isIdField) {
            // Поля только для чтения
            html += `<input type="text" id="${escapeHtml(key)}" name="${escapeHtml(key)}" 
                           value="" class="form-input" readonly>
                    <small class="readonly-note">Это поле заполняется автоматически</small>`;
        } else if (isBooleanField) {
            // Булевы поля
            html += `<select id="${escapeHtml(key)}" name="${escapeHtml(key)}" class="form-input">
                        <option value="true">Да</option>
                        <option value="false" selected>Нет</option>
                     </select>`;
        } else if (isDateField) {
            // Поля даты
            html += `<input type="datetime-local" id="${escapeHtml(key)}" name="${escapeHtml(key)}" 
                           class="form-input">`;
        } else if (isPasswordField) {
            // Поля пароля
            html += `<input type="password" id="${escapeHtml(key)}" name="${escapeHtml(key)}" 
                           placeholder="Введите пароль" class="form-input" required>`;
        } else {
            // Обычные текстовые поля
            html += `<input type="text" id="${escapeHtml(key)}" name="${escapeHtml(key)}" 
                           class="form-input" placeholder="Введите значение">`;
        }

        html += `</div>`;
    });

    html += `<div class="modal-actions">
                <button type="submit" class="btn btn-primary">Создать</button>
                <button type="button" class="btn btn-secondary" onclick="closeEditModal()">Отмена</button>
             </div>`;
    html += '</form>';

    modalContent.innerHTML = html;
    modal.style.display = 'flex';

    // Настраиваем обработчик формы
    const form = document.getElementById('createForm');
    if (form) {
        form.onsubmit = async function (e) {
            e.preventDefault();
            await submitCreateForm(form);
        };
    }
}

// Получение полей по умолчанию для таблицы
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

        // Отправляем запрос
        const result = await api.createRecord(currentTable, data);

        if (result.success) {
            showNotification('Запись успешно создана', 'success');
            closeEditModal();

            // Обновляем таблицу
            await generateData();
        } else {
            throw new Error(result.message || 'Ошибка при создании записи');
        }

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
        }

        showNotification(`${errorMessage}: ${error.message || 'Неизвестная ошибка'}`, 'error');
    }
}

// Показать модальное окно редактирования
function showEditModal(record) {
    if (!record) return;

    // Создаем модальное окно, если его нет
    if (!document.getElementById('editModal')) {
        createEditModal();
    }

    const modal = document.getElementById('editModal');
    const modalContent = document.getElementById('editModalContent');

    if (!modal || !modalContent) {
        console.error('Не удалось найти элементы модального окна редактирования');
        showNotification('Ошибка при открытии окна редактирования', 'error');
        return;
    }

    const recordId = api.getRecordId(record);
    const isAdmin = api.isAdmin();
    const isDeleted = isRecordDeleted(record);

    let html = `<h3>Редактирование записи</h3>`;

    if (isDeleted && isAdmin) {
        html += `<div class="admin-only-element" style="color: #ff6b6b;">
                    <strong>⚠️ Эта запись удалена</strong><br>
                    <small>Вы можете восстановить её, сняв отметку об удалении</small>
                 </div>`;
    }

    html += '<form id="editForm" class="edit-form">';

    const hiddenFields = getHiddenFieldsForRole();
    let fields = Object.keys(record).filter(key => !hiddenFields.includes(key.toLowerCase()));

    // Сортируем поля для администратора
    if (isAdmin) {
        fields = sortHeadersForAdmin(fields);
    }

    // Создаем поля формы
    fields.forEach(key => {
        let value = record[key];
        const formattedValue = escapeHtml(formatValueForInput(value));
        const label = escapeHtml(formatHeader(key));
        const isReadOnlyService = isReadOnlyServiceField(key);
        const isIdField = isIdColumn(key);
        const isBooleanField = typeof value === 'boolean';
        const isDateField = isDateColumn(key, value);
        const isPasswordField = key.toLowerCase() === 'password';

        html += `<div class="form-group">`;
        html += `<label for="${escapeHtml(key)}">${label}:</label>`;

        if (isReadOnlyService || isIdField) {
            // Поля только для чтения
            html += `<input type="text" id="${escapeHtml(key)}" name="${escapeHtml(key)}" 
                           value="${formattedValue}" class="form-input" readonly>
                    <small class="readonly-note">${isIdField ? 'ID нельзя изменить' : 'Это поле заполняется автоматически'}</small>`;
        } else if (isBooleanField) {
            // Булевы поля
            html += `<select id="${escapeHtml(key)}" name="${escapeHtml(key)}" class="form-input">
                        <option value="true" ${value === true ? 'selected' : ''}>Да</option>
                        <option value="false" ${value === false ? 'selected' : ''}>Нет</option>
                     </select>`;
        } else if (isDateField) {
            // Поля даты
            const dateValue = formatDateForInput(value);
            html += `<input type="datetime-local" id="${escapeHtml(key)}" name="${escapeHtml(key)}" 
                           value="${dateValue}" class="form-input">`;
        } else if (isPasswordField) {
            // Поля пароля (оставляем пустым, чтобы не показывать хэш)
            html += `<input type="password" id="${escapeHtml(key)}" name="${escapeHtml(key)}" 
                           placeholder="Оставьте пустым, чтобы не менять" class="form-input">`;
        } else {
            // Обычные текстовые поля
            html += `<input type="text" id="${escapeHtml(key)}" name="${escapeHtml(key)}" 
                           value="${formattedValue}" class="form-input">`;
        }

        html += `</div>`;
    });

    html += `<div class="modal-actions">
                <button type="submit" class="btn btn-primary">Сохранить</button>
                <button type="button" class="btn btn-secondary" onclick="closeEditModal()">Отмена</button>
             </div>`;
    html += '</form>';

    modalContent.innerHTML = html;
    modal.style.display = 'flex';

    // Настраиваем обработчик формы
    const form = document.getElementById('editForm');
    if (form) {
        form.onsubmit = async function (e) {
            e.preventDefault();
            await submitEditForm(recordId, form, isDeleted);
        };
    }
}

// Создание модального окна редактирования
function createEditModal() {
    const modal = document.createElement('div');
    modal.id = 'editModal';
    modal.className = 'modal';

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div id="editModalContent"></div>
        </div>
    `;

    document.body.appendChild(modal);

    // Закрытие по клику вне окна
    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeEditModal();
        }
    });

    // Закрытие по кнопке
    modal.querySelector('.close-modal').addEventListener('click', closeEditModal);

    return modal;
}

// Проверка, является ли поле датой
function isDateColumn(key, value) {
    if (!value) return false;

    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
    const dateFields = ['date', 'created', 'updated', 'deleted', 'lastlogin', 'when', 'at'];

    const isDateString = typeof value === 'string' && dateRegex.test(value);
    const hasDateInName = dateFields.some(field => key.toLowerCase().includes(field));

    return isDateString || hasDateInName;
}

// Форматирование даты для input[type="datetime-local"]
function formatDateForInput(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        // Преобразуем в формат YYYY-MM-DDTHH:MM
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

// Отправка формы редактирования
async function submitEditForm(recordId, form, wasDeleted) {
    try {
        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            // Проверяем, является ли поле только для чтения
            const input = form.querySelector(`[name="${key}"]`);
            if (input && (input.readOnly || input.disabled)) {
                continue;
            }

            // Для пароля пропускаем пустые значения
            if (key.toLowerCase() === 'password' && value === '') {
                continue;
            }

            data[key] = value;
        }

        console.log('📤 Отправка данных для редактирования:', data);

        // Отправляем запрос
        await api.updateRecord(currentTable, recordId, data);

        showNotification('Запись успешно обновлена', 'success');
        closeEditModal();

        // Обновляем таблицу
        await generateData();

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
        }

        showNotification(`${errorMessage}: ${error.message || 'Неизвестная ошибка'}`, 'error');
    }
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

// Обработка удаления/восстановления записи
async function handleDeleteRestore(record) {
    try {
        const recordId = api.getRecordId(record);
        const isAdmin = api.isAdmin();
        const isDeleted = isRecordDeleted(record);

        if (isAdmin && isDeleted) {
            // Восстановление записи (только для администратора)
            if (confirm('Восстановить эту запись?')) {
                const result = await api.restoreRecord(currentTable, recordId);

                if (result.success) {
                    showNotification('Запись восстановлена', 'success');
                    await generateData();
                } else {
                    throw new Error(result.message || 'Ошибка при восстановлении');
                }
            }
        } else {
            // Удаление записи
            let message = isAdmin ?
                'Пометить запись как удаленную (мягкое удаление)?' :
                'Удалить эту запись?';

            if (confirm(message)) {
                const result = await api.deleteRecord(currentTable, recordId);

                if (result.success) {
                    showNotification(isAdmin ? 'Запись помечена как удаленная' : 'Запись удалена', 'success');
                    await generateData();
                } else {
                    throw new Error(result.message || 'Ошибка при удалении');
                }
            }
        }
    } catch (error) {
        console.error('❌ Ошибка в handleDeleteRestore:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}

// Обработка редактирования записи
async function handleEditRecord(record) {
    try {
        const recordId = api.getRecordId(record);
        const isAdmin = api.isAdmin();
        const isDeleted = isRecordDeleted(record);

        if (isDeleted) {
            if (isAdmin) {
                if (!confirm('Эта запись удалена. Хотите восстановить и редактировать её?')) {
                    return;
                }
                const result = await api.restoreRecord(currentTable, recordId);
                if (result.success) {
                    showNotification('Запись восстановлена', 'success');
                    // Обновляем запись после восстановления
                    await generateData();
                    // Находим восстановленную запись
                    const updatedRecord = currentData.find(item => api.getRecordId(item) === recordId);
                    if (updatedRecord) {
                        showEditModal(updatedRecord);
                    }
                }
            } else {
                showNotification('Нельзя редактировать удаленную запись', 'error');
                return;
            }
        } else {
            showEditModal(record);
        }
    } catch (error) {
        console.error('❌ Ошибка при подготовке к редактированию:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}

// Просмотр детальной информации о записи
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
        html += `<div style="background-color: #fff0f0; padding: 10px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #ff6b6b;">
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
        noData.textContent = 'Выберите таблицу';
        noData.style.display = 'block';
    }

    currentData = [];
    currentFilters = {};
    sortColumn = '';
    sortDirection = 'asc';
}

// Проверка, нужно ли скрывать ID колонки
function shouldHideIdColumns() {
    return !api.isAdmin();
}

// Показ уведомления
function showNotification(message, type = 'info') {
    // Удаляем старые уведомления
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);

    // Закрытие по клику
    notification.addEventListener('click', () => {
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
        return value ? 'Да' : 'Нет';
    }

    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return value.toLocaleString('ru-RU');
        } else {
            return value.toFixed(2).replace('.', ',');
        }
    }

    if (typeof value === 'string') {
        // Проверяем, является ли строка датой
        const dateRegex = /^\d{4}-\d{2}-\d{2}/;
        if (dateRegex.test(value)) {
            try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    if (value.includes('T') && value.length > 10) {
                        return date.toLocaleDateString('ru-RU') + ' ' +
                            date.toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                    }
                    return date.toLocaleDateString('ru-RU');
                }
            } catch (e) {
                // Не дата, возвращаем как есть
            }
        }
        return value;
    }

    return String(value);
}

// Форматирование заголовка
function formatHeader(header) {
    const translations = {
        // ID поля
        'id': 'ID',
        'idequipment': 'ID Оборудования',
        'idfuel': 'ID Топлива',
        'idgeyser': 'ID Колонки',
        'idrepair': 'ID Ремонта',
        'idroles': 'ID Роли',
        'idusers': 'ID Пользователя',

        // Основные поля
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

        // Служебные поля
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

    // Преобразование camelCase и snake_case в читаемый текст
    const words = header
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

    return words.join(' ');
}

// Показать индикатор администратора
function showAdminIndicator() {
    if (!api.isAdmin()) return;

    // Удаляем старый индикатор, если есть
    const oldIndicator = document.querySelector('.admin-mode-indicator');
    if (oldIndicator) oldIndicator.remove();

    const indicator = document.createElement('div');
    indicator.className = 'admin-mode-indicator';
    indicator.textContent = '👑 РЕЖИМ АДМИНИСТРАТОРА';
    indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
        color: white;
        padding: 5px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(255, 152, 0, 0.3);
        animation: pulse 2s infinite;
    `;

    document.body.appendChild(indicator);
}

// Переход на страницу статистики
function showStatisticsPage() {
    if (!api.canViewStatistics()) {
        showNotification('Доступ к статистике только для администраторов и менеджеров', 'error');
        return;
    }

    window.location.href = 'statistics.html';
}

// Обновление данных (аналог generateData)
function refreshData() {
    generateData();
}

// Экспорт функций в глобальную область видимости
window.showStatisticsPage = showStatisticsPage;
window.logout = logout;
window.onTableSelect = onTableSelect;
window.generateData = generateData;
window.refreshData = refreshData;
window.viewDetails = viewDetails;
window.closeModal = closeModal;
window.closeEditModal = closeEditModal;
window.handleEditRecord = handleEditRecord;
window.showCreateModal = showCreateModal;
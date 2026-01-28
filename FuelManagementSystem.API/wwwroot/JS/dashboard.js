let currentTable = '';
let currentData = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    setupEventListeners();
    initDashboard();
});

function initDashboard() {
    clearTable();
    updateTableSelectBasedOnRole();
}

async function checkAuth() {
    const token = localStorage.getItem('authToken');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const userName = localStorage.getItem('userName');
    let userRole = localStorage.getItem('userRole');

    if (userName) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userName;
        }
    }

    if (userRole) {
        const userRoleElement = document.getElementById('userRole');
        if (userRoleElement) {
            userRoleElement.textContent = formatDisplayRole(userRole);
        }

        manageStatisticsButton();
        updateTableSelectBasedOnRole();
    }
}

function getHiddenFieldsForRole() {
    const isAdmin = api.isAdmin();

    if (isAdmin) {
        // Администратор видит ВСЕ поля, скрываем только чувствительные данные
        return ['passwordHash', 'resetToken', 'resetTokenExpiry', 'password'];
    } else {
        // Не-администраторы не видят служебные поля
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

function shouldHideIdColumns() {
    const isAdmin = api.isAdmin();
    // Администратор видит ID поля, остальные - нет
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

    const serviceKeywords = [
        'record', 'change', 'who', 'when', 'delete',
        'created', 'updated', 'modified', 'by', 'dateof', 'ofrecording',
        'ofchange', 'whorecorded', 'whochanged', 'whendeleted'
    ];

    return serviceKeywords.some(keyword => headerLower.includes(keyword));
}

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

function updateTableSelectBasedOnRole() {
    const tableSelect = document.getElementById('tableSelect');
    if (!tableSelect) {
        return;
    }

    const isAdmin = api.isAdmin();
    const options = tableSelect.options;

    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const value = option.value;

        if (value === 'users' || value === 'roles') {
            if (isAdmin) {
                option.style.display = 'block';
                option.disabled = false;
                option.classList.remove('hidden');
            } else {
                option.style.display = 'none';
                option.disabled = true;
                option.classList.add('hidden');

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
}

function manageStatisticsButton() {
    const statsBtn = document.getElementById('statisticsBtn');
    if (!statsBtn) {
        return;
    }

    const canViewStats = api.canViewStatistics();

    if (canViewStats) {
        statsBtn.classList.remove('hidden');
        statsBtn.style.display = 'inline-block';
    } else {
        statsBtn.classList.add('hidden');
        statsBtn.style.display = 'none';
    }
}

function formatDisplayRole(role) {
    if (!role) {
        return 'Пользователь';
    }

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
    if (!api.canViewStatistics()) {
        alert('Доступ к статистике только для администраторов и менеджеров');
        return;
    }

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
        console.log(`🔄 Загрузка данных для таблицы: ${currentTable}`);
        currentData = await api.getTableData(currentTable);
        console.log(`✅ Данные получены: ${currentData?.length || 0} записей`);

        if (!currentData || currentData.length === 0) {
            noData.textContent = 'В таблице нет данных';
            noData.style.display = 'block';
            tableContainer.style.display = 'none';
            showNotification('Данные не найдены', 'info');
        } else {
            // Отладочная информация о полях
            console.log(`📋 Поля первой записи для ${currentTable}:`, Object.keys(currentData[0]));
            console.log(`👁️ Администратор: ${api.isAdmin()}, Видит служебные поля: ${api.isAdmin() ? 'Да' : 'Нет'}`);

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
        }

        showNotification(`${errorMessage} (${error.status || 'нет статуса'})`, 'error');
    } finally {
        loading.classList.remove('active');
    }
}

function isRecordDeleted(record) {
    const deleteFields = ['whenDeleted', 'WhenDeleted', 'dateDeleted', 'DateDeleted', 'deletedAt', 'DeletedAt', 'isDeleted'];
    for (const field of deleteFields) {
        if (record[field] !== null && record[field] !== undefined && record[field] !== '') {
            if (typeof record[field] === 'boolean' && record[field] === true) {
                return true;
            }
            if (record[field] || record[field] === 0 || record[field] === false) {
                return true;
            }
        }
    }
    return false;
}

async function handleDeleteRestore(record) {
    try {
        const recordId = api.getRecordId(record);
        const isAdmin = api.isAdmin();
        const isDeleted = isRecordDeleted(record);

        if (isAdmin && isDeleted) {
            // Восстановление записи для администратора
            if (confirm('Восстановить эту запись?')) {
                const result = await api.restoreRecord(currentTable, recordId);

                if (result.local || result.localRestore) {
                    // Локальное восстановление
                    const index = currentData.findIndex(item => api.getRecordId(item) === recordId);
                    if (index !== -1) {
                        delete currentData[index].isDeleted;
                        delete currentData[index].IsDeleted;
                        delete currentData[index].deletedAt;
                        delete currentData[index].DeletedAt;
                        delete currentData[index].whenDeleted;
                        delete currentData[index].WhenDeleted;

                        displayTableData(currentData);
                        showNotification(result.message || 'Запись восстановлена локально', 'info');
                    }
                } else {
                    showNotification('Запись восстановлена', 'success');
                    generateData();
                }
            }
        } else {
            // Удаление записи
            let message = isAdmin ?
                'Пометить запись как удаленную?' :
                'Удалить эту запись?';

            if (confirm(message)) {
                const result = await api.deleteRecord(currentTable, recordId);

                if (result.local || result.localDelete) {
                    // Локальное удаление
                    if (isAdmin) {
                        // Мягкое удаление для администратора
                        const index = currentData.findIndex(item => api.getRecordId(item) === recordId);
                        if (index !== -1) {
                            currentData[index].isDeleted = true;
                            currentData[index].deletedAt = new Date().toISOString();
                            displayTableData(currentData);
                            showNotification('Запись помечена как удаленная локально', 'info');
                        }
                    } else {
                        // Удаление для обычных пользователей
                        const index = currentData.findIndex(item => api.getRecordId(item) === recordId);
                        if (index !== -1) {
                            currentData.splice(index, 1);
                            displayTableData(currentData);
                            showNotification('Запись удалена локально', 'info');
                        }
                    }
                } else {
                    showNotification(isAdmin ? 'Запись помечена как удаленная' : 'Запись удалена', 'success');
                    generateData();
                }
            }
        }
    } catch (error) {
        console.error('❌ Ошибка в handleDeleteRestore:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
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

    console.log(`📊 Отображение данных: ${data.length} записей, ${headers.length} полей`);
    console.log('🔍 Все поля:', headers);

    // Получаем поля для скрытия
    const hiddenFields = getHiddenFieldsForRole();
    console.log(`👁️ Скрытые поля для роли ${api.userRole}:`, hiddenFields);

    // Сначала фильтруем скрытые поля
    let displayHeaders = headers.filter(header =>
        !hiddenFields.includes(header.toLowerCase())
    );

    console.log(`👁️ Поля после скрытия: ${displayHeaders.length}`, displayHeaders);

    // Фильтрация ID столбцов для не-администраторов
    if (shouldHideIdColumns()) {
        const beforeFilterCount = displayHeaders.length;
        displayHeaders = displayHeaders.filter(header => !isIdColumn(header));
        console.log(`🆔 Отфильтровано ID полей: ${beforeFilterCount - displayHeaders.length}`);
    }

    // Для администратора сортируем заголовки - служебные поля в конце
    displayHeaders = sortHeadersForAdmin(displayHeaders);
    console.log(`🔧 Отсортированные заголовки:`, displayHeaders);

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
        const isServiceField = order < 999;

        if (api.isAdmin() && isServiceField) {
            th.classList.add('admin-service-header');
            th.style.backgroundColor = '#e8f5e9';
            th.style.borderLeft = '2px solid #4caf50';
            th.title = 'Служебное поле';

            // Добавляем иконку для служебных полей
            const iconSpan = document.createElement('span');
            iconSpan.textContent = ' 🔧';
            iconSpan.style.fontSize = '12px';
            iconSpan.style.marginLeft = '5px';
            th.appendChild(iconSpan);
        }

        // Стиль для ID полей администратора
        if (api.isAdmin() && isIdColumn(header)) {
            th.style.backgroundColor = '#fff0f0';
            th.style.color = '#990000';
            th.style.fontWeight = 'bold';
        }

        headerRow.appendChild(th);
    });

    const actionsTh = document.createElement('th');
    actionsTh.textContent = 'Действия';
    actionsTh.style.width = '150px';
    actionsTh.style.textAlign = 'center';
    headerRow.appendChild(actionsTh);

    tableHeader.appendChild(headerRow);

    data.forEach((row, rowIndex) => {
        const tableRow = document.createElement('tr');

        // Проверяем, удалена ли запись
        const isDeleted = isRecordDeleted(row);
        const isAdmin = api.isAdmin();

        // Для администратора показываем ВСЕ записи, для остальных - только неудаленные
        if (!isAdmin && isDeleted) {
            return; // Пропускаем удаленные записи для не-администраторов
        }

        // Для администратора: выделяем удаленные записи
        if (isAdmin && isDeleted) {
            tableRow.classList.add('admin-deleted-record');
            tableRow.style.backgroundColor = '#fff8f8';
            tableRow.style.borderLeft = '4px solid #ff6b6b';
            tableRow.style.opacity = '0.9';
        }

        // Ячейка с номером строки
        const numberTd = document.createElement('td');
        numberTd.textContent = rowIndex + 1;
        numberTd.style.textAlign = 'center';
        numberTd.style.fontWeight = 'bold';
        numberTd.style.backgroundColor = isAdmin && isDeleted ? '#ffe6e6' : '#f8f9fa';

        // Для администратора добавляем индикатор удаленной записи
        if (isAdmin && isDeleted) {
            const indicator = document.createElement('span');
            indicator.className = 'deleted-indicator';
            indicator.textContent = 'Удалено';
            indicator.style.cssText = `
                display: block;
                background-color: #ff6b6b;
                color: white;
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 10px;
                margin-top: 3px;
            `;
            numberTd.appendChild(indicator);
        }

        tableRow.appendChild(numberTd);

        displayHeaders.forEach((header, colIndex) => {
            const td = document.createElement('td');
            let value = row[header];
            value = formatValue(value);
            td.textContent = value;

            // Специальное форматирование для служебных полей администратора
            if (isAdmin) {
                const order = getServiceFieldOrder(header);
                const isId = isIdColumn(header);

                // Служебные поля дат (порядок 1, 2, 6, 7)
                if (order === 1 || order === 2 || order === 6 || order === 7) {
                    td.classList.add('admin-service-field-date');
                    td.style.fontFamily = 'monospace';
                    td.style.fontSize = '12px';
                    td.style.color = '#0066cc';
                    td.style.backgroundColor = isDeleted ? '#ffe6e6' : '#f0f8ff';
                }
                // Служебные поля "кто" (порядок 3 и 4)
                else if (order === 3 || order === 4) {
                    td.classList.add('admin-service-field-user');
                    td.style.fontStyle = 'italic';
                    td.style.color = '#666';
                    td.style.backgroundColor = isDeleted ? '#ffe6e6' : '#f9f9f9';
                }
                // Служебные поля "когда удалено" (порядок 5)
                else if (order === 5) {
                    td.classList.add('admin-service-field-delete');
                    td.style.fontFamily = 'monospace';
                    td.style.fontSize = '11px';
                    td.style.color = '#cc0000';
                    td.style.backgroundColor = '#fff0f0';
                    td.style.fontWeight = 'bold';

                    // Особое выделение даты удаления
                    if (value !== '-' && value !== '') {
                        td.style.border = '2px solid #ff6b6b';
                        td.style.borderRadius = '4px';
                        td.style.padding = '2px 4px';
                    }
                }
                // ID поля
                else if (isId) {
                    td.style.fontFamily = 'monospace';
                    td.style.backgroundColor = isDeleted ? '#ffe6e6' : '#fff0f0';
                    td.style.fontWeight = 'bold';
                    td.style.color = '#990000';
                }
                // Остальные служебные поля
                else if (order < 999) {
                    td.classList.add('admin-service-field');
                    td.style.fontFamily = 'monospace';
                    td.style.fontSize = '11px';
                    td.style.color = '#0066cc';
                    td.style.backgroundColor = isDeleted ? '#ffe6e6' : '#f0f8ff';
                }
            }

            tableRow.appendChild(td);
        });

        // Показываем действия только если запись не удалена или это администратор
        if (!isDeleted || isAdmin) {
            const actionsTd = document.createElement('td');
            actionsTd.className = 'actions-cell';
            actionsTd.style.textAlign = 'center';
            actionsTd.style.display = 'flex';
            actionsTd.style.gap = '5px';
            actionsTd.style.justifyContent = 'center';
            actionsTd.style.alignItems = 'center';

            // Кнопка просмотра
            const viewBtn = document.createElement('button');
            viewBtn.className = 'action-btn view-btn';
            viewBtn.textContent = '👁️';
            viewBtn.title = 'Просмотреть подробности';
            viewBtn.style.cssText = `
                padding: 5px 10px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                background-color: ${isAdmin && isDeleted ? '#6c757d' : '#4CAF50'};
                color: white;
                font-size: 14px;
                min-width: 40px;
            `;

            if (isAdmin && isDeleted) {
                viewBtn.title = 'Просмотреть удаленную запись';
            }

            viewBtn.onclick = () => viewDetails(row, displayHeaders);
            actionsTd.appendChild(viewBtn);

            // Кнопка удаления/восстановления
            const actionBtn = document.createElement('button');
            actionBtn.className = 'action-btn';
            actionBtn.style.cssText = `
                padding: 5px 10px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                color: white;
                font-size: 14px;
                min-width: 40px;
            `;

            if (isAdmin && isDeleted) {
                // Для администратора: кнопка восстановления удаленной записи
                actionBtn.textContent = '♻️';
                actionBtn.title = 'Восстановить запись';
                actionBtn.style.backgroundColor = '#2196F3';
                actionBtn.onclick = () => handleDeleteRestore(row);
            } else {
                // Для всех: кнопка удаления
                actionBtn.textContent = '🗑️';

                if (isAdmin) {
                    actionBtn.title = 'Пометить как удаленную (установить дату удаления)';
                    actionBtn.style.backgroundColor = '#ff9800';
                } else {
                    actionBtn.title = 'Удалить запись (скрыть из списка)';
                    actionBtn.style.backgroundColor = '#f44336';
                }

                actionBtn.onclick = () => handleDeleteRestore(row);
            }

            actionsTd.appendChild(actionBtn);
            tableRow.appendChild(actionsTd);
        } else {
            // Для удаленных записей у не-администраторов не показываем действия
            const emptyTd = document.createElement('td');
            tableRow.appendChild(emptyTd);
        }

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
        // Проверяем, является ли строка датой в формате ISO
        const dateRegex = /^\d{4}-\d{2}-\d{2}/;
        if (dateRegex.test(value)) {
            try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    // Для дат удаления возвращаем полное время
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

        // Служебные поля (показываются только администратору)
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
        'updatedat': 'Обновлено',
        'isdeleted': 'Удалено'
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

    const isDeleted = isRecordDeleted(data);

    if (isDeleted && api.isAdmin()) {
        html += '<div style="background-color: #fff0f0; padding: 10px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #ff6b6b;">';
        html += '<strong>⚠️ Эта запись удалена</strong><br>';
        html += '<small>Видна только администраторам. Дата удаления: ' +
            formatValue(data.WhenDeleted || data.whenDeleted || data.deletedAt) + '</small>';
        html += '</div>';
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

// Экспорт функций
window.showStatisticsPage = showStatisticsPage;
window.logout = logout;
window.onTableSelect = onTableSelect;
window.generateData = generateData;
window.refreshData = refreshData;
window.viewDetails = viewDetails;
window.closeModal = closeModal;
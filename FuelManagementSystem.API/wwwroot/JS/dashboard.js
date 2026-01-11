// Глобальные переменные
let currentTable = '';
let currentData = [];

// Проверка авторизации при загрузке
document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    setupEventListeners();
});

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
        if (userRole !== 'Admin') {
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
    } else {
        generateBtn.disabled = true;
    }
}

// Генерация данных
async function generateData() {
    if (!currentTable) return;

    const loading = document.getElementById('loading');
    const noData = document.getElementById('noData');
    const tableContainer = document.getElementById('dataTableContainer');

    // Показываем загрузку
    loading.classList.add('active');
    noData.style.display = 'none';
    tableContainer.style.display = 'none';

    try {
        // Получаем данные из API или используем моковые данные
        currentData = await fetchTableData(currentTable);

        // Отображаем данные
        displayTableData(currentData);

        tableContainer.style.display = 'block';
    } catch (error) {
        console.error('Error generating data:', error);
        noData.textContent = 'Ошибка загрузки данных';
        noData.style.display = 'block';
    } finally {
        loading.classList.remove('active');
    }
}

// Получение данных таблицы
async function fetchTableData(tableName) {
    try {
        // В реальном приложении здесь будет вызов API
        // return await apiService.getTableData(tableName);

        // Моковые данные для демонстрации
        return getMockData(tableName);
    } catch (error) {
        console.error('Error fetching table data:', error);
        throw error;
    }
}

// Отображение данных в таблице
function displayTableData(data) {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');

    // Очищаем таблицу
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    if (!data || data.length === 0) {
        document.getElementById('noData').style.display = 'block';
        document.getElementById('dataTableContainer').style.display = 'none';
        return;
    }

    // Создаем заголовки на основе ключей первого объекта
    const headers = Object.keys(data[0]);
    const headerRow = document.createElement('tr');

    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = formatHeader(header);
        headerRow.appendChild(th);
    });

    // Добавляем заголовок для действий
    const actionsTh = document.createElement('th');
    actionsTh.textContent = 'Действия';
    headerRow.appendChild(actionsTh);

    tableHeader.appendChild(headerRow);

    // Заполняем тело таблицы
    data.forEach((row, index) => {
        const tableRow = document.createElement('tr');

        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] || '-';
            tableRow.appendChild(td);
        });

        // Добавляем кнопки действий
        const actionsTd = document.createElement('td');
        actionsTd.className = 'actions-cell';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'action-btn view-btn';
        viewBtn.textContent = '👁️';
        viewBtn.onclick = () => viewDetails(row);
        actionsTd.appendChild(viewBtn);

        tableRow.appendChild(actionsTd);
        tableBody.appendChild(tableRow);
    });
}

// Форматирование заголовков
function formatHeader(header) {
    const words = header.replace(/([A-Z])/g, ' $1').trim().split(' ');
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Просмотр деталей записи
function viewDetails(data) {
    const modal = document.getElementById('detailsModal');
    const modalContent = document.getElementById('modalContent');

    let html = '<h3>Подробная информация</h3>';
    html += '<div class="details-container">';

    Object.entries(data).forEach(([key, value]) => {
        html += `
            <div class="detail-row">
                <span class="detail-label">${formatHeader(key)}:</span>
                <span class="detail-value">${value || '-'}</span>
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

// Моковые данные для демонстрации
function getMockData(tableName) {
    const mockData = {
        equipment: [
            { id: 1, name: 'Насос дизельный', type: 'Насос', status: 'Активен', location: 'Цех 1', lastMaintenance: '2024-01-15' },
            { id: 2, name: 'Резервуар 1000л', type: 'Резервуар', status: 'На ремонте', location: 'Цех 2', lastMaintenance: '2024-01-10' },
            { id: 3, name: 'Топливопровод', type: 'Трубопровод', status: 'Активен', location: 'Цех 1', lastMaintenance: '2024-01-12' },
            { id: 4, name: 'Контроллер уровня', type: 'Электроника', status: 'Активен', location: 'Цех 3', lastMaintenance: '2024-01-14' },
            { id: 5, name: 'Фильтр тонкой очистки', type: 'Фильтр', status: 'Заменен', location: 'Цех 2', lastMaintenance: '2024-01-18' }
        ],
        fuel: [
            { id: 1, type: 'Дизель', quantity: 1500, unit: 'литры', price: 55.5, supplier: 'Лукойл', date: '2024-01-15' },
            { id: 2, type: 'Бензин АИ-95', quantity: 2000, unit: 'литры', price: 52.3, supplier: 'Газпромнефть', date: '2024-01-14' },
            { id: 3, type: 'Бензин АИ-92', quantity: 1800, unit: 'литры', price: 48.7, supplier: 'Роснефть', date: '2024-01-13' },
            { id: 4, type: 'Масло моторное', quantity: 200, unit: 'литры', price: 350, supplier: 'Shell', date: '2024-01-12' },
            { id: 5, type: 'Антифриз', quantity: 150, unit: 'литры', price: 120, supplier: 'Mobil', date: '2024-01-11' }
        ],
        transactions: [
            { id: 1, date: '2024-01-15', type: 'Заправка', fuelType: 'Дизель', quantity: 50, amount: 2775, operator: 'Иванов И.И.' },
            { id: 2, date: '2024-01-14', type: 'Заправка', fuelType: 'Бензин АИ-95', quantity: 35, amount: 1830.5, operator: 'Петров П.П.' },
            { id: 3, date: '2024-01-13', type: 'Поступление', fuelType: 'Дизель', quantity: 1000, amount: 55500, operator: 'Сидоров С.С.' },
            { id: 4, date: '2024-01-12', type: 'Заправка', fuelType: 'Бензин АИ-92', quantity: 40, amount: 1948, operator: 'Иванов И.И.' },
            { id: 5, date: '2024-01-11', type: 'Списание', fuelType: 'Масло', quantity: 10, amount: 3500, operator: 'Петров П.П.' }
        ],
        users: [
            { id: 1, username: 'admin', email: 'admin@system.ru', role: 'Admin', status: 'Активен', lastLogin: '2024-01-15' },
            { id: 2, username: 'operator1', email: 'op1@system.ru', role: 'Operator', status: 'Активен', lastLogin: '2024-01-15' },
            { id: 3, username: 'operator2', email: 'op2@system.ru', role: 'Operator', status: 'Активен', lastLogin: '2024-01-14' },
            { id: 4, username: 'manager', email: 'manager@system.ru', role: 'Manager', status: 'Активен', lastLogin: '2024-01-13' },
            { id: 5, username: 'guest', email: 'guest@system.ru', role: 'Guest', status: 'Не активен', lastLogin: '2024-01-10' }
        ],
        stations: [
            { id: 1, name: 'Станция №1', location: 'Цех 1', type: 'Основная', status: 'Работает', fuelTypes: 'Дизель, Бензин', lastService: '2024-01-15' },
            { id: 2, name: 'Станция №2', location: 'Цех 2', type: 'Резервная', status: 'На обслуживании', fuelTypes: 'Дизель', lastService: '2024-01-14' },
            { id: 3, name: 'Станция №3', location: 'Цех 3', type: 'Мобильная', status: 'Работает', fuelTypes: 'Бензин', lastService: '2024-01-13' },
            { id: 4, name: 'Станция №4', location: 'Склад', type: 'Основная', status: 'Работает', fuelTypes: 'Дизель, Бензин, Масло', lastService: '2024-01-12' },
            { id: 5, name: 'Станция №5', location: 'Гараж', type: 'Резервная', status: 'Отключена', fuelTypes: 'Дизель', lastService: '2024-01-10' }
        ]
    };

    return mockData[tableName] || [];
}

// Закрытие модального окна при клике вне его
window.onclick = function (event) {
    const modal = document.getElementById('detailsModal');
    if (event.target == modal) {
        closeModal();
    }
};
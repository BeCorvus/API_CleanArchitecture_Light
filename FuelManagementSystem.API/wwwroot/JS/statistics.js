// Глобальные переменные для Chart.js
let currentChart = null;
const chartColors = {
    light: {
        background: 'white',
        text: '#333',
        grid: 'rgba(0, 0, 0, 0.1)'
    },
    dark: {
        background: '#1e1e1e',
        text: '#fff',
        grid: 'rgba(255, 255, 255, 0.1)'
    },
    blue: {
        background: '#f0f8ff',
        text: '#061f8a',
        grid: 'rgba(6, 31, 138, 0.1)'
    }
};

// Форматирование роли для отображения
function formatDisplayRole(role) {
    if (!role) return 'User';

    // Для ролей на русском - отображаем как есть
    if (role.toLowerCase() === 'администратор') {
        return 'Администратор';
    } else if (role.toLowerCase() === 'пользователь') {
        return 'Пользователь';
    } else if (role.toLowerCase() === 'оператор') {
        return 'Оператор';
    } else if (role.toLowerCase() === 'менеджер') {
        return 'Менеджер';
    } else if (role.toLowerCase() === 'техник') {
        return 'Техник';
    }

    // Для ролей на английском - делаем первую букву заглавной
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    initChart();
});

// Проверка авторизации и прав
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
        // Отображаем реальную роль из localStorage (как есть из API)
        document.getElementById('userRole').textContent = formatDisplayRole(userRole);

        // Если пользователь не админ, перенаправляем на главную
        if (!apiService.isAdmin()) {
            alert('Доступ к статистике только для администраторов');
            window.location.href = 'index.html';
        }
    }
}

// Выход из системы
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        apiService.clearData();
        window.location.href = 'login.html';
    }
}

// Инициализация диаграммы
function initChart() {
    const ctx = document.getElementById('statisticsChart').getContext('2d');

    const initialConfig = {
        type: 'bar',
        data: {
            labels: ['Выберите таблицу'],
            datasets: [{
                label: 'Нет данных',
                data: [0],
                backgroundColor: 'rgba(200, 200, 200, 0.5)',
                borderColor: 'rgba(150, 150, 150, 1)',
                borderWidth: 1
            }]
        },
        options: getChartOptions('bar', 'light')
    };

    currentChart = new Chart(ctx, initialConfig);
}

// Загрузка статистики (автоматически при выборе таблицы)
async function loadStatistics() {
    const tableSelect = document.getElementById('statTableSelect');
    const chartTypeSelect = document.getElementById('chartTypeSelect');
    const loading = document.getElementById('loading');
    const noData = document.getElementById('noData');

    if (!tableSelect.value) {
        noData.style.display = 'block';
        return;
    }

    loading.classList.add('active');
    noData.style.display = 'none';

    try {
        // Получаем данные для статистики
        const chartData = await fetchChartData(tableSelect.value, chartTypeSelect.value);

        // Обновляем диаграмму
        updateChart(chartData, chartTypeSelect.value);

        // Показываем статистические данные
        showChartStats(chartData);
    } catch (error) {
        console.error('Error loading statistics:', error);
        noData.textContent = 'Ошибка загрузки статистики';
        noData.style.display = 'block';
    } finally {
        loading.classList.remove('active');
    }
}

// Получение данных для диаграммы
async function fetchChartData(tableName, chartType) {
    try {
        // Загружаем данные из таблицы
        const data = await apiService.request(`/${tableName}`);

        // Преобразуем данные в формат для диаграммы
        return formatChartData(tableName, data, chartType);
    } catch (error) {
        console.error('Error fetching chart data:', error);
        return getDefaultChartData(tableName);
    }
}

// Форматирование данных для диаграммы
function formatChartData(tableName, data, chartType) {
    let chartData = {
        labels: [],
        data: [],
        title: getChartTitle(tableName)
    };

    if (!data || !Array.isArray(data) || data.length === 0) {
        return chartData;
    }

    // Обработка данных в зависимости от таблицы
    switch (tableName) {
        case 'equipment':
            // Статистика оборудования по брендам
            const brands = {};
            data.forEach(item => {
                const brand = item.brand || 'Не указан';
                brands[brand] = (brands[brand] || 0) + 1;
            });
            chartData.labels = Object.keys(brands);
            chartData.data = Object.values(brands);
            break;

        case 'fuel':
            // Статистика топлива по брендам и стоимости
            const fuelBrands = {};
            data.forEach(item => {
                const brand = item.brand || 'Не указан';
                fuelBrands[brand] = (fuelBrands[brand] || 0) + 1;
            });
            chartData.labels = Object.keys(fuelBrands);
            chartData.data = Object.values(fuelBrands);
            break;

        case 'geyser':
            // Статистика колонок по году выпуска
            const years = {};
            data.forEach(item => {
                const year = item.yearOfRelease || 'Не указан';
                years[year] = (years[year] || 0) + 1;
            });
            chartData.labels = Object.keys(years);
            chartData.data = Object.values(years);
            break;

        case 'users':
            // Статистика пользователей по ролям
            const userRoles = {};
            data.forEach(item => {
                const role = item.role || item.IdRoles || 'Не указана';
                userRoles[role] = (userRoles[role] || 0) + 1;
            });
            chartData.labels = Object.keys(userRoles);
            chartData.data = Object.values(userRoles);
            break;

        case 'repair':
            // Статистика ремонтов по стоимости (группировка)
            const costGroups = {
                'До 5000 ₽': 0,
                '5000-10000 ₽': 0,
                '10000-20000 ₽': 0,
                'Более 20000 ₽': 0
            };

            data.forEach(item => {
                const cost = item.cost || 0;
                if (cost <= 5000) costGroups['До 5000 ₽']++;
                else if (cost <= 10000) costGroups['5000-10000 ₽']++;
                else if (cost <= 20000) costGroups['10000-20000 ₽']++;
                else costGroups['Более 20000 ₽']++;
            });

            chartData.labels = Object.keys(costGroups);
            chartData.data = Object.values(costGroups);
            break;

        case 'roles':
            // Статистика ролей (просто количество)
            chartData.labels = data.map(role => role.name || 'Без названия');
            chartData.data = data.map(role => 1); // Каждая роль = 1
            break;

        default:
            // По умолчанию - количество записей
            chartData.labels = ['Записей в таблице'];
            chartData.data = [data.length];
    }

    return chartData;
}

// Получение заголовка для диаграммы
function getChartTitle(tableName) {
    const titles = {
        equipment: 'Статистика оборудования по брендам',
        fuel: 'Распределение топлива по брендам',
        geyser: 'Распределение колонок по году выпуска',
        users: 'Распределение пользователей по ролям',
        repair: 'Статистика ремонтов по стоимости',
        roles: 'Распределение ролей'
    };

    return titles[tableName] || `Статистика таблицы ${tableName}`;
}

// Заглушки для диаграмм при отсутствии данных
function getDefaultChartData(tableName) {
    return {
        labels: ['Нет данных'],
        data: [0],
        title: getChartTitle(tableName)
    };
}

// Обновление диаграммы
function updateChart(chartData, chartType) {
    if (!currentChart) return;

    // Обновляем данные
    currentChart.data.labels = chartData.labels;
    currentChart.data.datasets[0].label = chartData.title;
    currentChart.data.datasets[0].data = chartData.data;

    // Обновляем цвета
    const colors = getChartColors(chartType, chartData.data.length);
    currentChart.data.datasets[0].backgroundColor = colors.background;
    currentChart.data.datasets[0].borderColor = colors.border;
    currentChart.data.datasets[0].borderWidth = 2;

    // Обновляем тип диаграммы
    currentChart.config.type = chartType;

    // Обновляем настройки
    currentChart.options = getChartOptions(chartType, 'light');

    // Обновляем диаграмму
    currentChart.update();
}

// Получение цветов для диаграммы
function getChartColors(chartType, dataLength) {
    const colorPalette = [
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)'
    ];

    const borderPalette = [
        'rgba(54, 162, 235, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
    ];

    if (chartType === 'line') {
        return {
            background: 'rgba(54, 162, 235, 0.2)',
            border: 'rgba(54, 162, 235, 1)'
        };
    } else if (chartType === 'bar') {
        return {
            background: colorPalette.slice(0, Math.min(dataLength, colorPalette.length)),
            border: borderPalette.slice(0, Math.min(dataLength, borderPalette.length))
        };
    } else {
        return {
            background: colorPalette.slice(0, Math.min(dataLength, colorPalette.length)),
            border: borderPalette.slice(0, Math.min(dataLength, borderPalette.length))
        };
    }
}

// Получение настроек для диаграммы
function getChartOptions(chartType, theme) {
    const themeColors = chartColors[theme] || chartColors.light;

    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: themeColors.text,
                    font: {
                        size: 12
                    }
                }
            },
            title: {
                display: true,
                color: themeColors.text,
                font: {
                    size: 16,
                    weight: 'bold'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                titleColor: '#fff',
                bodyColor: '#fff'
            }
        }
    };

    if (chartType === 'pie' || chartType === 'doughnut') {
        return {
            ...baseOptions,
            plugins: {
                ...baseOptions.plugins,
                legend: {
                    ...baseOptions.plugins.legend,
                    position: 'right'
                }
            }
        };
    } else {
        return {
            ...baseOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: themeColors.grid
                    },
                    ticks: {
                        color: themeColors.text
                    }
                },
                x: {
                    grid: {
                        color: themeColors.grid
                    },
                    ticks: {
                        color: themeColors.text
                    }
                }
            }
        };
    }
}

// Показать статистические данные
function showChartStats(chartData) {
    const statsContainer = document.getElementById('chartStats');
    if (!statsContainer) return;

    const data = chartData.data;
    const total = data.reduce((sum, value) => sum + value, 0);
    const average = data.length > 0 ? total / data.length : 0;
    const max = data.length > 0 ? Math.max(...data) : 0;
    const min = data.length > 0 ? Math.min(...data) : 0;

    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${total.toLocaleString()}</div>
            <div class="stat-label">Всего записей</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${average.toFixed(2)}</div>
            <div class="stat-label">Среднее значение</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${max}</div>
            <div class="stat-label">Максимум</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${min}</div>
            <div class="stat-label">Минимум</div>
        </div>
    `;
}

// Экспорт диаграммы
function exportChart(format) {
    if (!currentChart) {
        alert('Сначала создайте диаграмму');
        return;
    }

    const canvas = document.getElementById('statisticsChart');
    const link = document.createElement('a');

    if (format === 'png') {
        link.href = canvas.toDataURL('image/png');
        link.download = `статистика_${new Date().toISOString().split('T')[0]}.png`;
    }

    link.click();
}

// Переключение отображения легенды
function toggleLegend() {
    if (!currentChart) return;

    currentChart.options.plugins.legend.display =
        !currentChart.options.plugins.legend.display;
    currentChart.update();
}

// Изменение темы диаграммы
function changeChartTheme(theme) {
    if (!currentChart) return;

    const canvas = document.querySelector('.chart-wrapper');
    const themeColors = chartColors[theme] || chartColors.light;

    // Обновляем фон
    canvas.style.backgroundColor = themeColors.background;

    // Обновляем настройки диаграммы
    currentChart.options = getChartOptions(currentChart.config.type, theme);
    currentChart.update();
}

// Экспорт функций в глобальную область видимости
window.logout = logout;
window.loadStatistics = loadStatistics;
window.exportChart = exportChart;
window.toggleLegend = toggleLegend;
window.changeChartTheme = changeChartTheme;
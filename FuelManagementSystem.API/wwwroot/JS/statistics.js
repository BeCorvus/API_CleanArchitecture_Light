// statistics.js
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

function formatDisplayRole(role) {
    if (!role) {
        console.warn('⚠️ Роль пустая при форматировании');
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

document.addEventListener('DOMContentLoaded', function () {
    console.log('📊 Инициализация страницы статистики...');
    checkAuth();
    initChart();
});

// statistics.js - обновленная функция checkAuth()

async function checkAuth() {
    console.log('🔐 Проверка авторизации для статистики...');
    const token = localStorage.getItem('authToken');

    if (!token) {
        console.log('❌ Токен не найден, перенаправление на вход');
        window.location.href = 'login.html';
        return;
    }

    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');

    console.log('📋 Данные пользователя:');
    console.log('👤 Имя:', userName);
    console.log('🎭 Роль:', userRole);

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

        // ✅ ИСПРАВЛЕНО: Используем метод canViewStatistics() из api.js
        const canViewStats = apiService.canViewStatistics();

        console.log('🔐 Результат проверки доступа:');
        console.log('👑 Администратор?:', apiService.isAdmin());
        console.log('👔 Менеджер?:', apiService.isManager());
        console.log('✅ Может просматривать статистику?:', canViewStats);

        if (!canViewStats) {
            console.log('❌ Доступ запрещен: пользователь не администратор и не менеджер');
            alert('Доступ к статистике только для администраторов и менеджеров');
            window.location.href = 'index.html';
            return;
        } else {
            console.log('✅ Доступ разрешен: пользователь администратор или менеджер');
        }
    } else {
        console.warn('⚠️ Роль пользователя не определена');
        alert('Информация о роли пользователя не найдена');
        window.location.href = 'index.html';
    }
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        apiService.clearData();
        window.location.href = 'login.html';
    }
}

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
    console.log('📈 Диаграмма инициализирована');
}

async function loadStatistics() {
    console.log('📊 Загрузка статистики...');
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
        const chartData = await fetchChartData(tableSelect.value, chartTypeSelect.value);
        updateChart(chartData, chartTypeSelect.value);
        showChartStats(chartData);
    } catch (error) {
        console.error('Error loading statistics:', error);
        noData.textContent = 'Ошибка загрузки статистики: ' + error.message;
        noData.style.display = 'block';
    } finally {
        loading.classList.remove('active');
    }
}

async function fetchChartData(tableName, chartType) {
    try {
        console.log(`📥 Загрузка данных для таблицы: ${tableName}`);
        const data = await apiService.request(`/${tableName}`);
        return formatChartData(tableName, data, chartType);
    } catch (error) {
        console.error('Error fetching chart data:', error);
        return getDefaultChartData(tableName);
    }
}

function formatChartData(tableName, data, chartType) {
    let chartData = {
        labels: [],
        data: [],
        title: getChartTitle(tableName)
    };

    if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn(`⚠️ Нет данных для таблицы ${tableName}`);
        return chartData;
    }

    console.log(`📋 Обработка ${data.length} записей для таблицы ${tableName}`);

    switch (tableName) {
        case 'equipment':
            const brands = {};
            data.forEach(item => {
                const brand = item.brand || 'Не указан';
                brands[brand] = (brands[brand] || 0) + 1;
            });
            chartData.labels = Object.keys(brands);
            chartData.data = Object.values(brands);
            break;

        case 'fuel':
            const fuelBrands = {};
            data.forEach(item => {
                const brand = item.brand || 'Не указан';
                fuelBrands[brand] = (fuelBrands[brand] || 0) + 1;
            });
            chartData.labels = Object.keys(fuelBrands);
            chartData.data = Object.values(fuelBrands);
            break;

        case 'geyser':
            const years = {};
            data.forEach(item => {
                const year = item.yearOfRelease || 'Не указан';
                years[year] = (years[year] || 0) + 1;
            });
            chartData.labels = Object.keys(years);
            chartData.data = Object.values(years);
            break;

        case 'users':
            const userRoles = {};
            data.forEach(item => {
                const role = item.role || item.IdRoles || 'Не указана';
                userRoles[role] = (userRoles[role] || 0) + 1;
            });
            chartData.labels = Object.keys(userRoles);
            chartData.data = Object.values(userRoles);
            break;

        case 'repair':
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
            chartData.labels = data.map(role => role.name || 'Без названия');
            chartData.data = data.map(role => 1);
            break;

        default:
            chartData.labels = ['Записей в таблице'];
            chartData.data = [data.length];
    }

    console.log(`✅ Сформированы данные для диаграммы: ${chartData.labels.length} элементов`);
    return chartData;
}

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

function getDefaultChartData(tableName) {
    console.log(`📊 Используются данные по умолчанию для таблицы ${tableName}`);
    return {
        labels: ['Нет данных'],
        data: [0],
        title: getChartTitle(tableName)
    };
}

function updateChart(chartData, chartType) {
    if (!currentChart) {
        console.error('❌ Диаграмма не инициализирована');
        return;
    }

    console.log('🔄 Обновление диаграммы с данными:', chartData);

    currentChart.data.labels = chartData.labels;
    currentChart.data.datasets[0].label = chartData.title;
    currentChart.data.datasets[0].data = chartData.data;

    const colors = getChartColors(chartType, chartData.data.length);
    currentChart.data.datasets[0].backgroundColor = colors.background;
    currentChart.data.datasets[0].borderColor = colors.border;
    currentChart.data.datasets[0].borderWidth = 2;

    currentChart.config.type = chartType;
    currentChart.options = getChartOptions(chartType, 'light');

    currentChart.update();
    console.log('✅ Диаграмма обновлена');
}

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

function toggleLegend() {
    if (!currentChart) return;

    currentChart.options.plugins.legend.display =
        !currentChart.options.plugins.legend.display;
    currentChart.update();
}

function changeChartTheme(theme) {
    if (!currentChart) return;

    const canvas = document.querySelector('.chart-wrapper');
    const themeColors = chartColors[theme] || chartColors.light;

    if (canvas) {
        canvas.style.backgroundColor = themeColors.background;
    }

    currentChart.options = getChartOptions(currentChart.config.type, theme);
    currentChart.update();
}

// Экспорт функций
window.logout = logout;
window.loadStatistics = loadStatistics;
window.exportChart = exportChart;
window.toggleLegend = toggleLegend;
window.changeChartTheme = changeChartTheme;
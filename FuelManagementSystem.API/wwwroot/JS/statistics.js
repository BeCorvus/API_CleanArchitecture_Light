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
        document.getElementById('userRole').textContent = userRole;

        // Если пользователь не админ, перенаправляем на главную
        if (userRole !== 'Admin') {
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

// Загрузка статистики
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
        const chartData = await fetchChartData(tableSelect.value);

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
async function fetchChartData(tableName) {
    try {
        // В реальном приложении здесь будет вызов API
        // return await apiService.getTableStats(tableName);

        // Моковые данные для демонстрации
        return getMockChartData(tableName);
    } catch (error) {
        console.error('Error fetching chart data:', error);
        throw error;
    }
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
    const average = total / data.length;
    const max = Math.max(...data);
    const min = Math.min(...data);

    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${total.toLocaleString()}</div>
            <div class="stat-label">Всего</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${average.toFixed(2)}</div>
            <div class="stat-label">Среднее</div>
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
        link.download = `диаграмма_${new Date().toISOString().split('T')[0]}.png`;
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

// Моковые данные для диаграмм
function getMockChartData(tableName) {
    const mockData = {
        equipment: {
            labels: ['Активен', 'На ремонте', 'Отключен', 'Резерв'],
            data: [65, 15, 10, 10],
            title: 'Статус оборудования'
        },
        fuel: {
            labels: ['Дизель', 'Бензин 95', 'Бензин 92', 'Масло', 'Антифриз'],
            data: [1500, 2000, 1800, 200, 150],
            title: 'Остатки топлива (литры)'
        },
        transactions: {
            labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
            data: [120, 190, 150, 170, 156, 165],
            title: 'Количество транзакций по месяцам'
        },
        users: {
            labels: ['Администраторы', 'Операторы', 'Менеджеры', 'Техники', 'Гости'],
            data: [3, 15, 8, 12, 25],
            title: 'Распределение пользователей по ролям'
        },
        stations: {
            labels: ['Станция 1', 'Станция 2', 'Станция 3', 'Станция 4', 'Станция 5'],
            data: [450, 520, 380, 610, 490],
            title: 'Количество операций по станциям'
        }
    };

    return mockData[tableName] || mockData.equipment;
}

// Закрытие модальных окон при клике вне их
window.onclick = function (event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
};
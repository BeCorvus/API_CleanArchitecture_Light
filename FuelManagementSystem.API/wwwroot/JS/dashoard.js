// Функции для dashboard
document.addEventListener('DOMContentLoaded', async function () {
    await checkAuth();
    await loadStats();
});

// Проверка авторизации
async function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const profile = await apiService.getProfile();
        if (profile && profile.username) {
            document.getElementById('userBtn').innerHTML = `👤 ${profile.username}`;
        }
    } catch (error) {
        console.error('Profile load error:', error);
        // Если профиль не загружается, всё равно остаёмся на странице
    }
}

// Загрузка статистики
async function loadStats() {
    try {
        const [equipment, fuel, geysers, repairs] = await Promise.all([
            apiService.getEquipment(),
            apiService.getFuel(),
            apiService.getGeysers(),
            apiService.getRepairs()
        ]);

        document.getElementById('equipmentCount').textContent = equipment ? equipment.length : 0;
        document.getElementById('fuelCount').textContent = fuel ? fuel.length : 0;
        document.getElementById('geyserCount').textContent = geysers ? geysers.length : 0;
        document.getElementById('repairCount').textContent = repairs ? repairs.length : 0;
    } catch (error) {
        console.error('Stats load error:', error);
    }
}

// Выход из системы
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        apiService.clearToken();
        window.location.href = '/login.html';
    }
}

// Equipment CRUD операции
async function getEquipment() {
    try {
        const result = await apiService.getEquipment();
        document.getElementById('equipmentOutput').innerHTML =
            `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) {
        document.getElementById('equipmentOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

async function createEquipment() {
    const equipment = {
        name: "Новый экскаватор",
        type: "Экскаватор",
        model: "CAT 320D",
        serialNumber: "CAT-2024-001",
        status: "Active",
        purchaseDate: new Date().toISOString().split('T')[0]
    };

    try {
        const result = await apiService.createEquipment(equipment);
        document.getElementById('equipmentOutput').innerHTML =
            `<pre>${JSON.stringify(result, null, 2)}</pre>`;
        await loadStats(); // Обновляем статистику
    } catch (error) {
        document.getElementById('equipmentOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

async function updateEquipment() {
    // Сначала получаем список оборудования
    try {
        const equipmentList = await apiService.getEquipment();
        if (equipmentList && equipmentList.length > 0) {
            const firstEquipment = equipmentList[0];
            const updatedEquipment = {
                ...firstEquipment,
                name: "Обновленное оборудование",
                status: "Maintenance"
            };

            const result = await apiService.updateEquipment(firstEquipment.id, updatedEquipment);
            document.getElementById('equipmentOutput').innerHTML =
                `<pre>${JSON.stringify(result, null, 2)}</pre>`;
        } else {
            document.getElementById('equipmentOutput').innerHTML =
                `<div style="color: orange;">Нет оборудования для обновления</div>`;
        }
    } catch (error) {
        document.getElementById('equipmentOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

async function deleteEquipment() {
    // Сначала получаем список оборудования
    try {
        const equipmentList = await apiService.getEquipment();
        if (equipmentList && equipmentList.length > 0) {
            const firstEquipment = equipmentList[0];
            const result = await apiService.deleteEquipment(firstEquipment.id);
            document.getElementById('equipmentOutput').innerHTML =
                `<pre>${JSON.stringify(result, null, 2)}</pre>`;
            await loadStats(); // Обновляем статистику
        } else {
            document.getElementById('equipmentOutput').innerHTML =
                `<div style="color: orange;">Нет оборудования для удаления</div>`;
        }
    } catch (error) {
        document.getElementById('equipmentOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

// Аналогичные функции для Fuel, Geyser, Repair...
// [Добавьте здесь аналогичные функции для остальных сущностей]

// Fuel CRUD операции
async function getFuel() {
    try {
        const result = await apiService.getFuel();
        document.getElementById('fuelOutput').innerHTML =
            `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) {
        document.getElementById('fuelOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

async function createFuel() {
    const fuel = {
        type: "Дизельное топливо",
        quantity: 1000,
        price: 50.5,
        supplier: "Поставщик ООО",
        purchaseDate: new Date().toISOString().split('T')[0]
    };

    try {
        const result = await apiService.createFuel(fuel);
        document.getElementById('fuelOutput').innerHTML =
            `<pre>${JSON.stringify(result, null, 2)}</pre>`;
        await loadStats();
    } catch (error) {
        document.getElementById('fuelOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

// Добавьте аналогичные функции для updateFuel и deleteFuel...

// Geyser CRUD операции
async function getGeysers() {
    try {
        const result = await apiService.getGeysers();
        document.getElementById('geyserOutput').innerHTML =
            `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) {
        document.getElementById('geyserOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

async function createGeyser() {
    const geyser = {
        location: "Цех №1",
        capacity: 500,
        status: "Active",
        lastMaintenanceDate: new Date().toISOString().split('T')[0]
    };

    try {
        const result = await apiService.createGeyser(geyser);
        document.getElementById('geyserOutput').innerHTML =
            `<pre>${JSON.stringify(result, null, 2)}</pre>`;
        await loadStats();
    } catch (error) {
        document.getElementById('geyserOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

// Repair CRUD операции
async function getRepairs() {
    try {
        const result = await apiService.getRepairs();
        document.getElementById('repairOutput').innerHTML =
            `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) {
        document.getElementById('repairOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

async function createRepair() {
    const repair = {
        equipmentId: 1,
        description: "Плановый технический осмотр",
        cost: 1500.00,
        repairDate: new Date().toISOString().split('T')[0],
        status: "Completed"
    };

    try {
        const result = await apiService.createRepair(repair);
        document.getElementById('repairOutput').innerHTML =
            `<pre>${JSON.stringify(result, null, 2)}</pre>`;
        await loadStats();
    } catch (error) {
        document.getElementById('repairOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}
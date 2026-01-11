// Функции для dashboard
document.addEventListener('DOMContentLoaded', async function () {
    console.log('Dashboard loaded');
    console.log('Token exists:', !!localStorage.getItem('authToken'));

    await checkAuth();
    await loadStats();
});

// Проверка авторизации
async function checkAuth() {
    const token = localStorage.getItem('authToken');
    console.log('Checking auth, token:', token);

    if (!token) {
        console.log('No token found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    try {
        console.log('Fetching user profile...');
        const profile = await apiService.getProfile();
        console.log('Profile response:', profile);

        if (profile && !profile.error) {
            if (profile.username) {
                document.getElementById('userBtn').innerHTML = `👤 ${profile.username}`;
                console.log('Username set:', profile.username);
            } else if (profile.email) {
                document.getElementById('userBtn').innerHTML = `👤 ${profile.email}`;
                console.log('Email set as username:', profile.email);
            } else {
                document.getElementById('userBtn').innerHTML = `👤 Пользователь`;
                console.warn('Профиль не содержит username или email:', profile);
            }
        } else {
            // Если ошибка, но не 401, все равно показываем интерфейс
            document.getElementById('userBtn').innerHTML = `👤 Пользователь`;
            console.warn('Профиль не загружен или содержит ошибку:', profile);

            // Если это ошибка авторизации (401), перенаправляем
            if (profile && profile.status === 401) {
                apiService.clearToken();
                window.location.href = 'login.html';
                return;
            }
        }
    } catch (error) {
        console.error('Profile load error:', error);
        document.getElementById('userBtn').innerHTML = `👤 Пользователь`;
        // Не перенаправляем на логин, чтобы не ломать работу других функций
        // только если это не ошибка авторизации
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            apiService.clearToken();
            window.location.href = 'login.html';
        }
    }
}

// Загрузка статистики
async function loadStats() {
    console.log('Loading stats...');
    try {
        const [equipment, fuel, geysers, repairs] = await Promise.all([
            apiService.getEquipment(),
            apiService.getFuel(),
            apiService.getGeysers(),
            apiService.getRepairs()
        ]);

        console.log('Stats loaded:', {
            equipment: equipment,
            fuel: fuel,
            geysers: geysers,
            repairs: repairs
        });

        document.getElementById('equipmentCount').textContent = equipment ? equipment.length : 0;
        document.getElementById('fuelCount').textContent = fuel ? fuel.length : 0;
        document.getElementById('geyserCount').textContent = geysers ? geysers.length : 0;
        document.getElementById('repairCount').textContent = repairs ? repairs.length : 0;

        console.log('Stats updated in UI');
    } catch (error) {
        console.error('Stats load error:', error);
        // Устанавливаем значения по умолчанию при ошибке
        document.getElementById('equipmentCount').textContent = '0';
        document.getElementById('fuelCount').textContent = '0';
        document.getElementById('geyserCount').textContent = '0';
        document.getElementById('repairCount').textContent = '0';
    }
}

// Выход из системы
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        apiService.clearToken();
        window.location.href = 'login.html';
    }
}

// Управление модальным окном
let currentEntityType = '';

function openCreateModal(entityType) {
    currentEntityType = entityType;

    // Скрываем все поля форм
    document.querySelectorAll('.form-fields').forEach(field => {
        field.style.display = 'none';
    });

    // Показываем нужные поля
    document.getElementById(entityType + 'Fields').style.display = 'block';

    // Устанавливаем заголовок
    const titles = {
        'equipment': 'Добавить оборудование',
        'fuel': 'Добавить топливо',
        'geyser': 'Добавить гейзер',
        'repair': 'Добавить ремонт'
    };

    document.getElementById('modalTitle').textContent = titles[entityType];
    document.getElementById('createModal').style.display = 'flex';
}

function closeCreateModal() {
    document.getElementById('createModal').style.display = 'none';
    document.getElementById('createForm').reset();
}

// Обработка формы создания
document.getElementById('createForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    let data = {};

    switch (currentEntityType) {
        case 'equipment':
            data = {
                name: document.getElementById('equipmentName').value,
                type: document.getElementById('equipmentType').value,
                model: document.getElementById('equipmentModel').value,
                brand: document.getElementById('equipmentBrand').value,
                serialNumber: document.getElementById('equipmentSerialNumber').value,
                note: document.getElementById('equipmentNote').value,
                status: document.getElementById('equipmentStatus').value,
                purchaseDate: new Date().toISOString().split('T')[0]
            };
            await createEntity(data, apiService.createEquipment.bind(apiService), 'equipmentOutput');
            break;

        case 'fuel':
            data = {
                type: document.getElementById('fuelType').value,
                quantity: parseFloat(document.getElementById('fuelQuantity').value),
                price: parseFloat(document.getElementById('fuelPrice').value),
                supplier: document.getElementById('fuelSupplier').value,
                purchaseDate: new Date().toISOString().split('T')[0]
            };
            await createEntity(data, apiService.createFuel.bind(apiService), 'fuelOutput');
            break;

        case 'geyser':
            data = {
                location: document.getElementById('geyserLocation').value,
                capacity: parseInt(document.getElementById('geyserCapacity').value),
                status: document.getElementById('geyserStatus').value,
                lastMaintenanceDate: new Date().toISOString().split('T')[0]
            };
            await createEntity(data, apiService.createGeyser.bind(apiService), 'geyserOutput');
            break;

        case 'repair':
            data = {
                equipmentId: parseInt(document.getElementById('repairEquipmentId').value),
                description: document.getElementById('repairDescription').value,
                cost: parseFloat(document.getElementById('repairCost').value),
                status: document.getElementById('repairStatus').value,
                repairDate: new Date().toISOString().split('T')[0]
            };
            await createEntity(data, apiService.createRepair.bind(apiService), 'repairOutput');
            break;
    }

    closeCreateModal();
});

async function createEntity(data, apiMethod, outputElementId) {
    console.log(`Creating ${currentEntityType} with data:`, data);

    try {
        const result = await apiMethod(data);
        console.log(`Create ${currentEntityType} result:`, result);

        if (result && result.error) {
            document.getElementById(outputElementId).innerHTML =
                `<div style="color: red;">Ошибка создания: ${result.message}</div>`;
        } else {
            document.getElementById(outputElementId).innerHTML =
                `<pre>✅ Создано успешно!\n${JSON.stringify(result, null, 2)}</pre>`;
            await loadStats();
        }
    } catch (error) {
        console.error(`Create ${currentEntityType} error:`, error);
        document.getElementById(outputElementId).innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

// Equipment CRUD операции
async function getEquipment() {
    console.log('Getting equipment...');
    try {
        const result = await apiService.getEquipment();
        console.log('Equipment result:', result);
        document.getElementById('equipmentOutput').innerHTML =
            `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) {
        console.error('Get equipment error:', error);
        document.getElementById('equipmentOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

async function updateEquipment() {
    console.log('Updating equipment...');
    try {
        const equipmentList = await apiService.getEquipment();
        if (equipmentList && equipmentList.length > 0) {
            const firstEquipment = equipmentList[0];
            console.log('Updating equipment ID:', firstEquipment.id);

            const updatedEquipment = {
                ...firstEquipment,
                name: "Обновленное оборудование",
                status: "Maintenance",
                updatedAt: new Date().toISOString(),
                // Убедимся, что обязательные поля есть
                brand: firstEquipment.brand || "Caterpillar",
                note: firstEquipment.note || "Обновленное оборудование"
            };

            const result = await apiService.updateEquipment(firstEquipment.id, updatedEquipment);
            console.log('Update equipment result:', result);

            if (result && result.error) {
                document.getElementById('equipmentOutput').innerHTML =
                    `<div style="color: red;">Ошибка обновления: ${result.message}</div>`;
            } else {
                document.getElementById('equipmentOutput').innerHTML =
                    `<pre>✅ Обновлено успешно!\n${JSON.stringify(result, null, 2)}</pre>`;
                await loadStats();
            }
        } else {
            document.getElementById('equipmentOutput').innerHTML =
                `<div style="color: orange;">Нет оборудования для обновления. Сначала создайте оборудование.</div>`;
        }
    } catch (error) {
        console.error('Update equipment error:', error);
        document.getElementById('equipmentOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

async function deleteEquipment() {
    console.log('Deleting equipment...');
    try {
        const equipmentList = await apiService.getEquipment();
        if (equipmentList && equipmentList.length > 0) {
            const firstEquipment = equipmentList[0];
            console.log('Deleting equipment ID:', firstEquipment.id);

            if (confirm(`Вы уверены, что хотите удалить оборудование "${firstEquipment.name}"?`)) {
                const result = await apiService.deleteEquipment(firstEquipment.id);
                console.log('Delete equipment result:', result);

                if (result && result.error) {
                    document.getElementById('equipmentOutput').innerHTML =
                        `<div style="color: red;">Ошибка удаления: ${result.message}</div>`;
                } else {
                    document.getElementById('equipmentOutput').innerHTML =
                        `<pre>✅ Удалено успешно!\n${JSON.stringify(result, null, 2)}</pre>`;
                    await loadStats();
                }
            }
        } else {
            document.getElementById('equipmentOutput').innerHTML =
                `<div style="color: orange;">Нет оборудования для удаления</div>`;
        }
    } catch (error) {
        console.error('Delete equipment error:', error);
        document.getElementById('equipmentOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

// Fuel CRUD операции
async function getFuel() {
    console.log('Getting fuel...');
    try {
        const result = await apiService.getFuel();
        console.log('Fuel result:', result);
        document.getElementById('fuelOutput').innerHTML =
            `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) {
        console.error('Get fuel error:', error);
        document.getElementById('fuelOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

async function updateFuel() {
    console.log('Updating fuel...');
    try {
        const fuelList = await apiService.getFuel();
        if (fuelList && fuelList.length > 0) {
            const firstFuel = fuelList[0];
            console.log('Updating fuel ID:', firstFuel.id);

            const updatedFuel = {
                ...firstFuel,
                quantity: 1500,
                price: 55.5,
                updatedAt: new Date().toISOString()
            };

            const result = await apiService.updateFuel(firstFuel.id, updatedFuel);
            console.log('Update fuel result:', result);

            if (result && result.error) {
                document.getElementById('fuelOutput').innerHTML =
                    `<div style="color: red;">Ошибка обновления: ${result.message}</div>`;
            } else {
                document.getElementById('fuelOutput').innerHTML =
                    `<pre>✅ Обновлено успешно!\n${JSON.stringify(result, null, 2)}</pre>`;
                await loadStats();
            }
        } else {
            document.getElementById('fuelOutput').innerHTML =
                `<div style="color: orange;">Нет топлива для обновления. Сначала создайте топливо.</div>`;
        }
    } catch (error) {
        console.error('Update fuel error:', error);
        document.getElementById('fuelOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

async function deleteFuel() {
    console.log('Deleting fuel...');
    try {
        const fuelList = await apiService.getFuel();
        if (fuelList && fuelList.length > 0) {
            const firstFuel = fuelList[0];
            console.log('Deleting fuel ID:', firstFuel.id);

            if (confirm(`Вы уверены, что хотите удалить топливо "${firstFuel.type}"?`)) {
                const result = await apiService.deleteFuel(firstFuel.id);
                console.log('Delete fuel result:', result);

                if (result && result.error) {
                    document.getElementById('fuelOutput').innerHTML =
                        `<div style="color: red;">Ошибка удаления: ${result.message}</div>`;
                } else {
                    document.getElementById('fuelOutput').innerHTML =
                        `<pre>✅ Удалено успешно!\n${JSON.stringify(result, null, 2)}</pre>`;
                    await loadStats();
                }
            }
        } else {
            document.getElementById('fuelOutput').innerHTML =
                `<div style="color: orange;">Нет топлива для удаления</div>`;
        }
    } catch (error) {
        console.error('Delete fuel error:', error);
        document.getElementById('fuelOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

// Geyser CRUD операции
async function getGeysers() {
    console.log('Getting geysers...');
    try {
        const result = await apiService.getGeysers();
        console.log('Geysers result:', result);
        document.getElementById('geyserOutput').innerHTML =
            `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) {
        console.error('Get geysers error:', error);
        document.getElementById('geyserOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

async function updateGeyser() {
    console.log('Updating geyser...');
    try {
        const geyserList = await apiService.getGeysers();
        if (geyserList && geyserList.length > 0) {
            const firstGeyser = geyserList[0];
            console.log('Updating geyser ID:', firstGeyser.id);

            const updatedGeyser = {
                ...firstGeyser,
                location: "Обновленный цех",
                capacity: 600,
                status: "Maintenance",
                updatedAt: new Date().toISOString()
            };

            const result = await apiService.updateGeyser(firstGeyser.id, updatedGeyser);
            console.log('Update geyser result:', result);

            if (result && result.error) {
                document.getElementById('geyserOutput').innerHTML =
                    `<div style="color: red;">Ошибка обновления: ${result.message}</div>`;
            } else {
                document.getElementById('geyserOutput').innerHTML =
                    `<pre>✅ Обновлено успешно!\n${JSON.stringify(result, null, 2)}</pre>`;
                await loadStats();
            }
        } else {
            document.getElementById('geyserOutput').innerHTML =
                `<div style="color: orange;">Нет гейзеров для обновления. Сначала создайте гейзер.</div>`;
        }
    } catch (error) {
        console.error('Update geyser error:', error);
        document.getElementById('geyserOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

async function deleteGeyser() {
    console.log('Deleting geyser...');
    try {
        const geyserList = await apiService.getGeysers();
        if (geyserList && geyserList.length > 0) {
            const firstGeyser = geyserList[0];
            console.log('Deleting geyser ID:', firstGeyser.id);

            if (confirm(`Вы уверены, что хотите удалить гейзер в "${firstGeyser.location}"?`)) {
                const result = await apiService.deleteGeyser(firstGeyser.id);
                console.log('Delete geyser result:', result);

                if (result && result.error) {
                    document.getElementById('geyserOutput').innerHTML =
                        `<div style="color: red;">Ошибка удаления: ${result.message}</div>`;
                } else {
                    document.getElementById('geyserOutput').innerHTML =
                        `<pre>✅ Удалено успешно!\n${JSON.stringify(result, null, 2)}</pre>`;
                    await loadStats();
                }
            }
        } else {
            document.getElementById('geyserOutput').innerHTML =
                `<div style="color: orange;">Нет гейзеров для удаления</div>`;
        }
    } catch (error) {
        console.error('Delete geyser error:', error);
        document.getElementById('geyserOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

// Repair CRUD операции
async function getRepairs() {
    console.log('Getting repairs...');
    try {
        const result = await apiService.getRepairs();
        console.log('Repairs result:', result);
        document.getElementById('repairOutput').innerHTML =
            `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    } catch (error) {
        console.error('Get repairs error:', error);
        document.getElementById('repairOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

async function updateRepair() {
    console.log('Updating repair...');
    try {
        const repairList = await apiService.getRepairs();
        if (repairList && repairList.length > 0) {
            const firstRepair = repairList[0];
            console.log('Updating repair ID:', firstRepair.id);

            const updatedRepair = {
                ...firstRepair,
                description: "Обновленный ремонт",
                cost: 2000.00,
                status: "In Progress",
                updatedAt: new Date().toISOString()
            };

            const result = await apiService.updateRepair(firstRepair.id, updatedRepair);
            console.log('Update repair result:', result);

            if (result && result.error) {
                document.getElementById('repairOutput').innerHTML =
                    `<div style="color: red;">Ошибка обновления: ${result.message}</div>`;
            } else {
                document.getElementById('repairOutput').innerHTML =
                    `<pre>✅ Обновлено успешно!\n${JSON.stringify(result, null, 2)}</pre>`;
                await loadStats();
            }
        } else {
            document.getElementById('repairOutput').innerHTML =
                `<div style="color: orange;">Нет ремонтов для обновления. Сначала создайте ремонт.</div>`;
        }
    } catch (error) {
        console.error('Update repair error:', error);
        document.getElementById('repairOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

async function deleteRepair() {
    console.log('Deleting repair...');
    try {
        const repairList = await apiService.getRepairs();
        if (repairList && repairList.length > 0) {
            const firstRepair = repairList[0];
            console.log('Deleting repair ID:', firstRepair.id);

            if (confirm(`Вы уверены, что хотите удалить ремонт "${firstRepair.description}"?`)) {
                const result = await apiService.deleteRepair(firstRepair.id);
                console.log('Delete repair result:', result);

                if (result && result.error) {
                    document.getElementById('repairOutput').innerHTML =
                        `<div style="color: red;">Ошибка удаления: ${result.message}</div>`;
                } else {
                    document.getElementById('repairOutput').innerHTML =
                        `<pre>✅ Удалено успешно!\n${JSON.stringify(result, null, 2)}</pre>`;
                    await loadStats();
                }
            }
        } else {
            document.getElementById('repairOutput').innerHTML =
                `<div style="color: orange;">Нет ремонтов для удаления</div>`;
        }
    } catch (error) {
        console.error('Delete repair error:', error);
        document.getElementById('repairOutput').innerHTML =
            `<div style="color: red;">Ошибка: ${error.message}</div>`;
    }
}

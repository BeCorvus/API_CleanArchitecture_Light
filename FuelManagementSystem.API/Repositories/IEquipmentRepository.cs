using FuelManagementSystem.API.Models;

namespace FuelManagementSystem.API.Repositories
{
    public interface IEquipmentRepository : IRepository<Equipment>
    {
        Task<IEnumerable<Equipment>> GetByGeyserIdAsync(int geyserId);
        Task<IEnumerable<Equipment>> GetByBrandAsync(string brand);

        // Новые методы для работы с активными записями
        Task<IEnumerable<Equipment>> GetAllActiveAsync();
        Task<Equipment> GetActiveByIdAsync(int id);
        Task RestoreAsync(int id);
    }
}
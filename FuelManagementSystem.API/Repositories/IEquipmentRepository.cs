using FuelManagementSystem.API.Models;

namespace FuelManagementSystem.API.Repositories
{
    public interface IEquipmentRepository : IRepository<Equipment>
    {
        // Можно добавить специфичные для Equipment методы
        Task<IEnumerable<Equipment>> GetByGeyserIdAsync(int geyserId);
        Task<IEnumerable<Equipment>> GetByBrandAsync(string brand);
    }
}
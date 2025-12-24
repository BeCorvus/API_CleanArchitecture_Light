using FuelManagementSystem.API.Models;

namespace FuelManagementSystem.API.Repositories
{
    public interface IGeyserRepository : IRepository<Geyser>
    {
        // Специфичные для Geyser методы
        Task<IEnumerable<Geyser>> GetByManufacturerAsync(string manufacturer);
        Task<IEnumerable<Geyser>> GetByYearOfReleaseRangeAsync(int? startYear, int? endYear);
        Task<IEnumerable<Geyser>> GetByFuelIdAsync(int fuelId);
        Task<IEnumerable<Geyser>> GetByRepairIdAsync(int repairId);

        // Методы для работы с активными записями
        Task<IEnumerable<Geyser>> GetAllActiveAsync();
        Task<Geyser> GetActiveByIdAsync(int id);
        Task RestoreAsync(int id);
    }
}
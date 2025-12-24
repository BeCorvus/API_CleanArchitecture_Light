using FuelManagementSystem.API.Models;

namespace FuelManagementSystem.API.Repositories
{
    public interface IFuelRepository : IRepository<Fuel>
    {
        // Специфичные для Fuel методы
        Task<IEnumerable<Fuel>> GetByBrandAsync(string brand);
        Task<IEnumerable<Fuel>> GetByManufacturerAsync(string manufacturer);
        Task<IEnumerable<Fuel>> GetByShelfLifeRangeAsync(int? minShelfLife, int? maxShelfLife);
        Task<IEnumerable<Fuel>> GetByCostRangeAsync(decimal? minCost, decimal? maxCost);

        // Методы для работы с активными записями
        Task<IEnumerable<Fuel>> GetAllActiveAsync();
        Task<Fuel> GetActiveByIdAsync(int id);
        Task RestoreAsync(int id);
    }
}
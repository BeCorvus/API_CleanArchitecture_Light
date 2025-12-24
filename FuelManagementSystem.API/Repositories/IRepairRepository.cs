using FuelManagementSystem.API.Models;

namespace FuelManagementSystem.API.Repositories
{
    public interface IRepairRepository : IRepository<Repair>
    {
        // Специфичные для Repair методы
        Task<IEnumerable<Repair>> GetByRepairmanAsync(string repairman);
        Task<IEnumerable<Repair>> GetByManufacturerAsync(string manufacturer);
        Task<IEnumerable<Repair>> GetByDateOfRepairRangeAsync(DateOnly? startDate, DateOnly? endDate);
        Task<IEnumerable<Repair>> GetByCostRangeAsync(decimal? minCost, decimal? maxCost);

        // Методы для работы с активными записями
        Task<IEnumerable<Repair>> GetAllActiveAsync();
        Task<Repair> GetActiveByIdAsync(int id);
        Task RestoreAsync(int id);
    }
}
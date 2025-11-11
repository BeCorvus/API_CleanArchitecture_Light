using FuelManagementSystem.API.Models;

namespace FuelManagementSystem.API.Repositories
{
    public interface IRoleRepository : IRepository<Role>
    {
        // Специфичные для Role методы
        Task<IEnumerable<Role>> GetByNameRoleAsync(string nameRole);

        // Методы для работы с активными записями
        Task<IEnumerable<Role>> GetAllActiveAsync();
        Task<Role> GetActiveByIdAsync(int id);
        Task RestoreAsync(int id);
    }
}
using FuelManagementSystem.API.Models;

namespace FuelManagementSystem.API.Repositories
{
    public interface IUsersRoleRepository : IRepository<UsersRole>
    {
        Task<UsersRole?> GetByUserIdAsync(int userId);
        Task<IEnumerable<UsersRole>> GetRolesByUserIdAsync(int userId);
        Task<bool> UserHasRoleAsync(int userId, int roleId);
        Task<bool> UserHasRoleByNameAsync(int userId, string roleName);
        Task RemoveAllUserRolesAsync(int userId);
        Task<bool> IsUserInRoleAsync(int userId, string roleName);
        Task<UsersRole?> GetUserRoleAsync(int userId, int roleId);

        // Методы для работы с активными записями
        Task<IEnumerable<UsersRole>> GetAllActiveAsync();
        Task<UsersRole> GetActiveByIdAsync(int id);
        Task RestoreAsync(int id);
    }
}
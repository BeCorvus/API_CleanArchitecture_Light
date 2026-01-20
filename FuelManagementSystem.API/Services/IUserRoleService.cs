using FuelManagementSystem.API.DTO;

namespace FuelManagementSystem.API.Services
{
    public interface IUserRoleService
    {
        Task AssignDefaultRoleToUserAsync(int userId, string whoRecorded);
        Task<bool> AssignRoleToUserAsync(int userId, int roleId, string whoRecorded);
        Task<bool> UpdateUserRoleAsync(int userId, int roleId, string whoChanged);
        Task<bool> RemoveUserFromRoleAsync(int userId, int roleId, string whoChanged);
        Task<bool> IsUserAdminAsync(int userId);
        Task<bool> IsUserInRoleAsync(int userId, string roleName);
        Task<string?> GetUserRoleNameAsync(int userId);
        Task<int?> GetUserRoleIdAsync(int userId);
        Task<UserWithRoleDto?> GetUserWithRoleAsync(int userId);
        Task<IEnumerable<UserWithRoleDto>> GetUsersWithRolesAsync();
    }
}
using FuelManagementSystem.API.DTO;
using FuelManagementSystem.API.Models;
using FuelManagementSystem.API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace FuelManagementSystem.API.Services
{
    public class UserRoleService : IUserRoleService
    {
        private readonly IUsersRoleRepository _usersRoleRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<UserRoleService> _logger;

        public UserRoleService(
            IUsersRoleRepository usersRoleRepository,
            IRoleRepository roleRepository,
            IUserRepository userRepository,
            ILogger<UserRoleService> logger)
        {
            _usersRoleRepository = usersRoleRepository;
            _roleRepository = roleRepository;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task AssignDefaultRoleToUserAsync(int userId, string whoRecorded)
        {
            try
            {
                // Ищем роль "user" (по умолчанию)
                var roles = await _roleRepository.GetByNameRoleAsync("user");
                var userRole = roles.FirstOrDefault();

                if (userRole == null)
                {
                    // Если роли "user" нет, создаем её
                    userRole = new Role
                    {
                        NameRole = "user",
                        Note = "Default user role",
                        DateOfRecording = DateTime.Now,
                        WhoRecorded = "System"
                    };
                    await _roleRepository.AddAsync(userRole);
                    _logger.LogInformation("Created default 'user' role");
                }

                // Назначаем роль пользователю
                await AssignRoleToUserAsync(userId, userRole.IdRoles, whoRecorded);

                _logger.LogInformation($"Assigned default 'user' role to user {userId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error assigning default role to user {userId}");
                throw;
            }
        }

        public async Task<bool> AssignRoleToUserAsync(int userId, int roleId, string whoRecorded)
        {
            try
            {
                // Проверяем существование пользователя
                var user = await _userRepository.GetActiveByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning($"User {userId} not found when trying to assign role");
                    return false;
                }

                // Проверяем существование роли
                var role = await _roleRepository.GetActiveByIdAsync(roleId);
                if (role == null)
                {
                    _logger.LogWarning($"Role {roleId} not found when trying to assign to user");
                    return false;
                }

                // Проверяем, есть ли уже такая роль у пользователя
                var existingUserRole = await _usersRoleRepository.GetUserRoleAsync(userId, roleId);
                if (existingUserRole != null)
                {
                    _logger.LogInformation($"User {userId} already has role {roleId}");
                    return true; // Уже есть эта роль
                }

                // Создаем новую связь
                var userRole = new UsersRole
                {
                    IdUsers = userId,
                    IdRoles = roleId,
                    DateOfRecording = DateTime.Now,
                    WhoRecorded = whoRecorded,
                    Note = $"Role {role.NameRole} assigned"
                };

                await _usersRoleRepository.AddAsync(userRole);

                _logger.LogInformation($"Assigned role {role.NameRole} to user {userId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error assigning role {roleId} to user {userId}");
                return false;
            }
        }

        public async Task<bool> UpdateUserRoleAsync(int userId, int roleId, string whoChanged)
        {
            try
            {
                // Сначала удаляем все текущие роли пользователя (мягкое удаление)
                await _usersRoleRepository.RemoveAllUserRolesAsync(userId);

                // Назначаем новую роль
                return await AssignRoleToUserAsync(userId, roleId, whoChanged);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating role for user {userId}");
                return false;
            }
        }

        public async Task<bool> RemoveUserFromRoleAsync(int userId, int roleId, string whoChanged)
        {
            try
            {
                var userRole = await _usersRoleRepository.GetUserRoleAsync(userId, roleId);
                if (userRole == null)
                {
                    _logger.LogWarning($"User {userId} doesn't have role {roleId}");
                    return false;
                }

                // Мягкое удаление
                userRole.WhenDeleted = DateTime.Now;
                userRole.DateOfChange = DateTime.Now;
                userRole.WhoChanged = whoChanged;
                userRole.Note = $"Role removed by {whoChanged}";

                await _usersRoleRepository.UpdateAsync(userRole);

                _logger.LogInformation($"Removed role {roleId} from user {userId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error removing role {roleId} from user {userId}");
                return false;
            }
        }

        public async Task<bool> IsUserAdminAsync(int userId)
        {
            return await _usersRoleRepository.IsUserInRoleAsync(userId, "admin");
        }

        public async Task<bool> IsUserInRoleAsync(int userId, string roleName)
        {
            return await _usersRoleRepository.IsUserInRoleAsync(userId, roleName);
        }

        public async Task<string?> GetUserRoleNameAsync(int userId)
        {
            var userRole = await _usersRoleRepository.GetByUserIdAsync(userId);
            return userRole?.IdRolesNavigation?.NameRole;
        }

        public async Task<int?> GetUserRoleIdAsync(int userId)
        {
            var userRole = await _usersRoleRepository.GetByUserIdAsync(userId);
            return userRole?.IdRoles;
        }

        public async Task<UserWithRoleDto?> GetUserWithRoleAsync(int userId)
        {
            var user = await _userRepository.GetActiveByIdAsync(userId);
            if (user == null) return null;

            var roleName = await GetUserRoleNameAsync(userId);
            var roleId = await GetUserRoleIdAsync(userId);

            return new UserWithRoleDto
            {
                Id = user.IdUsers,
                Email = user.Email,
                Login = user.Login,
                Note = user.Note,
                RoleName = roleName,
                RoleId = roleId
            };
        }

        public async Task<IEnumerable<UserWithRoleDto>> GetUsersWithRolesAsync()
        {
            var users = await _userRepository.GetAllActiveAsync();
            var result = new List<UserWithRoleDto>();

            foreach (var user in users)
            {
                var roleName = await GetUserRoleNameAsync(user.IdUsers);
                var roleId = await GetUserRoleIdAsync(user.IdUsers);

                result.Add(new UserWithRoleDto
                {
                    Id = user.IdUsers,
                    Email = user.Email,
                    Login = user.Login,
                    Note = user.Note,
                    RoleName = roleName,
                    RoleId = roleId
                });
            }

            return result;
        }
    }
}
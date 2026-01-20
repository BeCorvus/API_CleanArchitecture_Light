using FuelManagementSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FuelManagementSystem.API.Repositories
{
    public class UsersRoleRepository : Repository<UsersRole>, IUsersRoleRepository
    {
        public UsersRoleRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<UsersRole?> GetByUserIdAsync(int userId)
        {
            return await _context.UsersRoles
                .Include(ur => ur.IdRolesNavigation)
                .FirstOrDefaultAsync(ur => ur.IdUsers == userId && ur.WhenDeleted == null);
        }

        public async Task<IEnumerable<UsersRole>> GetRolesByUserIdAsync(int userId)
        {
            return await _context.UsersRoles
                .Include(ur => ur.IdRolesNavigation)
                .Where(ur => ur.IdUsers == userId && ur.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<bool> UserHasRoleAsync(int userId, int roleId)
        {
            return await _context.UsersRoles
                .AnyAsync(ur => ur.IdUsers == userId &&
                               ur.IdRoles == roleId &&
                               ur.WhenDeleted == null);
        }

        public async Task<bool> UserHasRoleByNameAsync(int userId, string roleName)
        {
            return await _context.UsersRoles
                .Include(ur => ur.IdRolesNavigation)
                .AnyAsync(ur => ur.IdUsers == userId &&
                               ur.IdRolesNavigation != null &&
                               ur.IdRolesNavigation.NameRole == roleName &&
                               ur.WhenDeleted == null);
        }

        public async Task<bool> IsUserInRoleAsync(int userId, string roleName)
        {
            return await UserHasRoleByNameAsync(userId, roleName);
        }

        public async Task<UsersRole?> GetUserRoleAsync(int userId, int roleId)
        {
            return await _context.UsersRoles
                .FirstOrDefaultAsync(ur => ur.IdUsers == userId &&
                                          ur.IdRoles == roleId &&
                                          ur.WhenDeleted == null);
        }

        public async Task RemoveAllUserRolesAsync(int userId)
        {
            var userRoles = await _context.UsersRoles
                .Where(ur => ur.IdUsers == userId && ur.WhenDeleted == null)
                .ToListAsync();

            foreach (var userRole in userRoles)
            {
                userRole.WhenDeleted = DateTime.Now;
                userRole.DateOfChange = DateTime.Now;
                userRole.WhoChanged = "System";
            }

            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<UsersRole>> GetAllActiveAsync()
        {
            return await _context.UsersRoles
                .Include(ur => ur.IdUsersNavigation)
                .Include(ur => ur.IdRolesNavigation)
                .Where(ur => ur.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<UsersRole> GetActiveByIdAsync(int id)
        {
            return await _context.UsersRoles
                .Include(ur => ur.IdUsersNavigation)
                .Include(ur => ur.IdRolesNavigation)
                .FirstOrDefaultAsync(ur => ur.IdUsersRoles == id && ur.WhenDeleted == null);
        }

        public async Task RestoreAsync(int id)
        {
            var userRole = await GetByIdAsync(id);
            if (userRole != null)
            {
                userRole.WhenDeleted = null;
                userRole.DateOfChange = DateTime.Now;
                userRole.WhoChanged = "System";
                await UpdateAsync(userRole);
            }
        }
    }
}
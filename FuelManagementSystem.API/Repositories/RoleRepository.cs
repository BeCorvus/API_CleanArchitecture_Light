using FuelManagementSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FuelManagementSystem.API.Repositories
{
    public class RoleRepository : Repository<Role>, IRoleRepository
    {
        public RoleRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Role>> GetByNameRoleAsync(string nameRole)
        {
            return await _context.Roles
                .Where(r => r.NameRole == nameRole && r.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<IEnumerable<Role>> GetAllActiveAsync()
        {
            return await _context.Roles
                .Where(r => r.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<Role> GetActiveByIdAsync(int id)
        {
            return await _context.Roles
                .FirstOrDefaultAsync(r => r.IdRoles == id && r.WhenDeleted == null);
        }

        public async Task RestoreAsync(int id)
        {
            var role = await GetByIdAsync(id);
            if (role != null)
            {
                role.WhenDeleted = null;
                role.DateOfChange = DateTime.Now;
                role.WhoChanged = "System";
                await UpdateAsync(role);
            }
        }
    }
}
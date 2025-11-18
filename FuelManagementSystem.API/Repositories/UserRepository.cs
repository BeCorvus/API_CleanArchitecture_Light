using FuelManagementSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FuelManagementSystem.API.Repositories
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<User>> GetByEmailAsync(string email)
        {
            return await _context.Users
                .Where(u => u.Email == email && u.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<IEnumerable<User>> GetByLoginAsync(string login)
        {
            return await _context.Users
                .Where(u => u.Login == login && u.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<User> GetByEmailAndPasswordAsync(string email, string password)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email && u.Password == password && u.WhenDeleted == null);
        }

        public async Task<IEnumerable<User>> GetAllActiveAsync()
        {
            return await _context.Users
                .Where(u => u.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<User> GetActiveByIdAsync(int id)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.IdUsers == id && u.WhenDeleted == null);
        }

        public async Task RestoreAsync(int id)
        {
            var user = await GetByIdAsync(id);
            if (user != null)
            {
                user.WhenDeleted = null;
                user.DateOfChange = DateTime.Now;
                user.WhoChanged = "System";
                await UpdateAsync(user);
            }
        }
    }
}
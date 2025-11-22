using FuelManagementSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FuelManagementSystem.API.Repositories
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<User> GetByEmailAsync(string email)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email && u.WhenDeleted == null);
        }

        public async Task<User> GetByLoginAsync(string login)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Login == login && u.WhenDeleted == null);
        }

        public async Task<bool> UserExistsAsync(string email, string login)
        {
            return await _context.Users
                .AnyAsync(u => (u.Email == email || u.Login == login) && u.WhenDeleted == null);
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

        public async Task<User> GetByResetTokenAsync(string resetToken)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.ResetToken == resetToken && u.ResetTokenExpiry > DateTime.UtcNow);
        }
    }
}
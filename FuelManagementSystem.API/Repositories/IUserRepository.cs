using FuelManagementSystem.API.Models;

namespace FuelManagementSystem.API.Repositories
{
    public interface IUserRepository : IRepository<User>
    {
        Task<User> GetByEmailAsync(string email);
        Task<User> GetByLoginAsync(string login);
        Task<bool> UserExistsAsync(string email, string login);

        // Методы для работы с активными записями
        Task<IEnumerable<User>> GetAllActiveAsync();
        Task<User> GetActiveByIdAsync(int id);
        Task RestoreAsync(int id);
    }
}
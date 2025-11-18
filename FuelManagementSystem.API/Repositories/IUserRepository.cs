using FuelManagementSystem.API.Models;

namespace FuelManagementSystem.API.Repositories
{
    public interface IUserRepository : IRepository<User>
    {
        // Специфичные для User методы
        Task<IEnumerable<User>> GetByEmailAsync(string email);
        Task<IEnumerable<User>> GetByLoginAsync(string login);
        Task<User> GetByEmailAndPasswordAsync(string email, string password);

        // Методы для работы с активными записями
        Task<IEnumerable<User>> GetAllActiveAsync();
        Task<User> GetActiveByIdAsync(int id);
        Task RestoreAsync(int id);
    }
}
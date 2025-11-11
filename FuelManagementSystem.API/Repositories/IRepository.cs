using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace FuelManagementSystem.API.Repositories
{
    public interface IRepository<T> where T : class
    {
        Task<IEnumerable<T>> GetAllAsync();
        Task<T> GetByIdAsync(int id);
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
        Task AddAsync(T entity);
        Task UpdateAsync(T entity);
        Task SoftDeleteAsync(int id);

        // Новые методы для работы с мягким удалением
        Task<IEnumerable<T>> GetAllActiveAsync();
        Task<T> GetActiveByIdAsync(int id);
        Task RestoreAsync(int id);
    }
}
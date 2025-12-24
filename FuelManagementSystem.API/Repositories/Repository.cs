using FuelManagementSystem.API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace FuelManagementSystem.API.Repositories
{
    public class Repository<T> : IRepository<T> where T : class
    {
        protected readonly ApplicationDbContext _context;
        protected readonly DbSet<T> _dbSet;

        public Repository(ApplicationDbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        public async Task<IEnumerable<T>> GetAllAsync()
        {
            return await _dbSet.ToListAsync();
        }

        public async Task<T> GetByIdAsync(int id)
        {
            return await _dbSet.FindAsync(id);
        }

        public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        {
            return await _dbSet.Where(predicate).ToListAsync();
        }

        public async Task AddAsync(T entity)
        {
            await _dbSet.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(T entity)
        {
            _dbSet.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task SoftDeleteAsync(int id)
        {
            var entity = await GetByIdAsync(id);
            if (entity != null && entity is ISoftDelete softDeleteEntity)
            {
                softDeleteEntity.WhenDeleted = DateTime.Now;
                await UpdateAsync(entity);
            }
        }

        // Дополнительные методы для работы с мягким удалением
        public async Task<IEnumerable<T>> GetAllActiveAsync()
        {
            if (typeof(ISoftDelete).IsAssignableFrom(typeof(T)))
            {
                return await _dbSet
                    .Where(e => ((ISoftDelete)e).WhenDeleted == null)
                    .ToListAsync();
            }
            return await _dbSet.ToListAsync();
        }

        public async Task<T> GetActiveByIdAsync(int id)
        {
            var entity = await GetByIdAsync(id);
            if (entity != null && entity is ISoftDelete softDeleteEntity)
            {
                return softDeleteEntity.WhenDeleted == null ? entity : null;
            }
            return entity;
        }

        public async Task RestoreAsync(int id)
        {
            var entity = await GetByIdAsync(id);
            if (entity != null && entity is ISoftDelete softDeleteEntity)
            {
                softDeleteEntity.WhenDeleted = null;
                await UpdateAsync(entity);
            }
        }
    }
}
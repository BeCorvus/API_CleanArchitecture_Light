using FuelManagementSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FuelManagementSystem.API.Repositories
{
    public class FuelRepository : Repository<Fuel>, IFuelRepository
    {
        public FuelRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Fuel>> GetByBrandAsync(string brand)
        {
            return await _context.Fuels
                .Where(f => f.Brand == brand && f.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<IEnumerable<Fuel>> GetByManufacturerAsync(string manufacturer)
        {
            return await _context.Fuels
                .Where(f => f.Manufacturer == manufacturer && f.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<IEnumerable<Fuel>> GetByShelfLifeRangeAsync(int? minShelfLife, int? maxShelfLife)
        {
            var query = _context.Fuels.Where(f => f.WhenDeleted == null);

            if (minShelfLife.HasValue)
                query = query.Where(f => f.ShelfLife >= minShelfLife.Value);

            if (maxShelfLife.HasValue)
                query = query.Where(f => f.ShelfLife <= maxShelfLife.Value);

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<Fuel>> GetByCostRangeAsync(decimal? minCost, decimal? maxCost)
        {
            var query = _context.Fuels.Where(f => f.WhenDeleted == null);

            if (minCost.HasValue)
                query = query.Where(f => f.Cost >= minCost.Value);

            if (maxCost.HasValue)
                query = query.Where(f => f.Cost <= maxCost.Value);

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<Fuel>> GetAllActiveAsync()
        {
            return await _context.Fuels
                .Where(f => f.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<Fuel> GetActiveByIdAsync(int id)
        {
            return await _context.Fuels
                .FirstOrDefaultAsync(f => f.IdFuel == id && f.WhenDeleted == null);
        }

        public async Task RestoreAsync(int id)
        {
            var fuel = await GetByIdAsync(id);
            if (fuel != null)
            {
                fuel.WhenDeleted = null;
                fuel.DateOfChange = DateTime.Now;
                fuel.WhoChanged = "System";
                await UpdateAsync(fuel);
            }
        }
    }
}
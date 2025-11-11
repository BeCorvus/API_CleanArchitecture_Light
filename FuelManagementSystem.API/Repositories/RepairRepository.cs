using FuelManagementSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FuelManagementSystem.API.Repositories
{
    public class RepairRepository : Repository<Repair>, IRepairRepository
    {
        public RepairRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Repair>> GetByRepairmanAsync(string repairman)
        {
            return await _context.Repairs
                .Where(r => r.Repairman == repairman && r.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<IEnumerable<Repair>> GetByManufacturerAsync(string manufacturer)
        {
            return await _context.Repairs
                .Where(r => r.Manufacturer == manufacturer && r.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<IEnumerable<Repair>> GetByDateOfRepairRangeAsync(DateOnly? startDate, DateOnly? endDate)
        {
            var query = _context.Repairs.Where(r => r.WhenDeleted == null);

            if (startDate.HasValue)
                query = query.Where(r => r.DateOfRepair >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(r => r.DateOfRepair <= endDate.Value);

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<Repair>> GetByCostRangeAsync(decimal? minCost, decimal? maxCost)
        {
            var query = _context.Repairs.Where(r => r.WhenDeleted == null);

            if (minCost.HasValue)
                query = query.Where(r => r.Cost >= minCost.Value);

            if (maxCost.HasValue)
                query = query.Where(r => r.Cost <= maxCost.Value);

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<Repair>> GetAllActiveAsync()
        {
            return await _context.Repairs
                .Where(r => r.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<Repair> GetActiveByIdAsync(int id)
        {
            return await _context.Repairs
                .FirstOrDefaultAsync(r => r.IdRepair == id && r.WhenDeleted == null);
        }

        public async Task RestoreAsync(int id)
        {
            var repair = await GetByIdAsync(id);
            if (repair != null)
            {
                repair.WhenDeleted = null;
                repair.DateOfChange = DateTime.Now;
                repair.WhoChanged = "System";
                await UpdateAsync(repair);
            }
        }
    }
}
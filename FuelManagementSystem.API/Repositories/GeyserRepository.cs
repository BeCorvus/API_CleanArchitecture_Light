using FuelManagementSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FuelManagementSystem.API.Repositories
{
    public class GeyserRepository : Repository<Geyser>, IGeyserRepository
    {
        public GeyserRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Geyser>> GetByManufacturerAsync(string manufacturer)
        {
            return await _context.Geysers
                .Where(g => g.Manufacturer == manufacturer && g.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<IEnumerable<Geyser>> GetByYearOfReleaseRangeAsync(int? startYear, int? endYear)
        {
            var query = _context.Geysers.Where(g => g.WhenDeleted == null);

            if (startYear.HasValue)
                query = query.Where(g => g.YearOfRelease >= startYear.Value);

            if (endYear.HasValue)
                query = query.Where(g => g.YearOfRelease <= endYear.Value);

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<Geyser>> GetByFuelIdAsync(int fuelId)
        {
            return await _context.Geysers
                .Where(g => g.IdFuel == fuelId && g.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<IEnumerable<Geyser>> GetByRepairIdAsync(int repairId)
        {
            return await _context.Geysers
                .Where(g => g.IdRepair == repairId && g.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<IEnumerable<Geyser>> GetAllActiveAsync()
        {
            return await _context.Geysers
                .Where(g => g.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<Geyser> GetActiveByIdAsync(int id)
        {
            return await _context.Geysers
                .FirstOrDefaultAsync(g => g.IdGeyser == id && g.WhenDeleted == null);
        }

        public async Task RestoreAsync(int id)
        {
            var geyser = await GetByIdAsync(id);
            if (geyser != null)
            {
                geyser.WhenDeleted = null;
                geyser.DateOfChange = DateTime.Now;
                geyser.WhoChanged = "System";
                await UpdateAsync(geyser);
            }
        }
    }
}
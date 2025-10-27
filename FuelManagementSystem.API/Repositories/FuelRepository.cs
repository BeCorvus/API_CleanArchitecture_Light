using FuelManagementSystem.API.Data;
using FuelManagementSystem.Models;
using Microsoft.EntityFrameworkCore;


namespace FuelManagementSystem.API.Repositories
{
    public class FuelColumnRepository : Repository<FuelColumn>, IFuelColumnRepository
    {
        public FuelColumnRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<FuelColumn>> GetFuelColumnsWithNozzlesAsync()
        {
            return await _context.FuelColumns
                .Include(c => c.Nozzles)
                .ToListAsync();
        }
    }

    public interface IFuelColumnRepository : IRepository<FuelColumn>
    {
        Task<IEnumerable<FuelColumn>> GetFuelColumnsWithNozzlesAsync();
    }
}
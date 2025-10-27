using FuelManagementSystem.API.Models;
using Microsoft.EntityFrameworkCore;


namespace FuelManagementSystem.API.Repositories
{
    public class FuelRepository : Repository<Fuel>, IFuelRepository
    {
        public FuelRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Fuel>> GetFuelColumnsWithNozzlesAsync()
        {
            return await _context.Fuels
                .Include(c => c.Brand)
                .ToListAsync();
        }
    }

    public interface IFuelRepository : IRepository<Fuel>
    {
        Task<IEnumerable<Fuel>> GetFuelColumnsWithNozzlesAsync();
    }
}
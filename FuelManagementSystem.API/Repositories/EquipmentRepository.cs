using FuelManagementSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FuelManagementSystem.API.Repositories
{
    public class EquipmentRepository : Repository<Equipment>, IEquipmentRepository
    {
        public EquipmentRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Equipment>> GetByGeyserIdAsync(int geyserId)
        {
            return await _context.Equipment
                .Where(e => e.IdGeyser == geyserId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Equipment>> GetByBrandAsync(string brand)
        {
            return await _context.Equipment
                .Where(e => e.Brand == brand)
                .ToListAsync();
        }
    }
}
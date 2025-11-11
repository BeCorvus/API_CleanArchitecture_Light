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
                .Where(e => e.IdGeyser == geyserId && e.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<IEnumerable<Equipment>> GetByBrandAsync(string brand)
        {
            return await _context.Equipment
                .Where(e => e.Brand == brand && e.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<IEnumerable<Equipment>> GetAllActiveAsync()
        {
            return await _context.Equipment
                .Where(e => e.WhenDeleted == null)
                .ToListAsync();
        }

        public async Task<Equipment> GetActiveByIdAsync(int id)
        {
            return await _context.Equipment
                .FirstOrDefaultAsync(e => e.IdEquipment == id && e.WhenDeleted == null);
        }

        public async Task RestoreAsync(int id)
        {
            var equipment = await GetByIdAsync(id);
            if (equipment != null)
            {
                equipment.WhenDeleted = null;
                equipment.DateOfChange = DateTime.Now;
                equipment.WhoChanged = "System";
                await UpdateAsync(equipment);
            }
        }
    }
}
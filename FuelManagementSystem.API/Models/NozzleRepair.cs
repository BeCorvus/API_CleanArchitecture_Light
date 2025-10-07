using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FuelManagementSystem.Models
{
    public class NozzleRepair
    {
        [Key]
        public int ID_NozzleRepair { get; set; }
        
        [ForeignKey("Repair")]
        public int ID_Repair { get; set; }
        
        [ForeignKey("Nozzle")]
        public int ID_Nozzle { get; set; }
        
        // Навигационные свойства
        public Repair Repair { get; set; }
        public Nozzle Nozzle { get; set; }
    }
}
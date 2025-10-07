using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FuelManagementSystem.Models
{
    public class EquipmentRepair
    {
        [Key]
        public int ID_EquipmentRepair { get; set; }
        
        [ForeignKey("Repair")]
        public int ID_Repair { get; set; }
        
        [ForeignKey("Equipment")]
        public int ID_Equipment { get; set; }
        
        // Навигационные свойства
        public Repair Repair { get; set; }
        public Equipment Equipment { get; set; }
    }
}
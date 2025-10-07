using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FuelManagementSystem.Models
{
    public class ColumnEquipment
    {
        [Key]
        public int ID_ColumnEquipment { get; set; }
        
        [ForeignKey("FuelColumn")]
        public int ID_Column { get; set; }
        
        [ForeignKey("Equipment")]
        public int ID_Equipment { get; set; }
        
        // Навигационные свойства
        public FuelColumn FuelColumn { get; set; }
        public Equipment Equipment { get; set; }
    }
}
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FuelManagementSystem.Models
{
    public class ColumnRepair
    {
        [Key]
        public int ID_ColumnRepair { get; set; }
        
        [ForeignKey("Repair")]
        public int ID_Repair { get; set; }
        
        [ForeignKey("FuelColumn")]
        public int ID_Column { get; set; }
        
        // Навигационные свойства
        public Repair Repair { get; set; }
        public FuelColumn FuelColumn { get; set; }
    }
}
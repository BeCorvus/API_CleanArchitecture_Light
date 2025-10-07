using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FuelManagementSystem.Models
{
    public class Equipment : BaseEntity
    {
        [Key]
        public int ID_Equipment { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        
        [StringLength(50)]
        public string Brand { get; set; }
        
        [ForeignKey("FuelColumn")]
        public int? ID_Column { get; set; }
        
        // Навигационные свойства
        public FuelColumn FuelColumn { get; set; }
        public ICollection<ColumnEquipment> ColumnEquipments { get; set; }
        public ICollection<EquipmentRepair> EquipmentRepairs { get; set; }
    }
}
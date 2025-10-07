using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FuelManagementSystem.Models
{
    public class FuelColumn : BaseEntity
    {
        [Key]
        public int ID_Column { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        
        public int ManufactureYear { get; set; }
        
        [StringLength(100)]
        public string Manufacturer { get; set; }
        
        public int NozzleCount { get; set; }
        
        // Навигационные свойства
        public ICollection<Nozzle> Nozzles { get; set; }
        public ICollection<ColumnEquipment> ColumnEquipments { get; set; }
        public ICollection<ColumnRepair> ColumnRepairs { get; set; }
    }
}
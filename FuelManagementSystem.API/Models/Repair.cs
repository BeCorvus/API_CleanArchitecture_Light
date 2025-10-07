using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FuelManagementSystem.Models
{
    public class Repair : BaseEntity
    {
        [Key]
        public int ID_Repair { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        
        public DateTime RepairDate { get; set; }
        
        [StringLength(100)]
        public string Manufacturer { get; set; }
        
        public DateTime ManufactureDate { get; set; }
        
        [StringLength(100)]
        public string Repairer { get; set; }
        
        public decimal Cost { get; set; }
        
        // Навигационные свойства
        public ICollection<ColumnRepair> ColumnRepairs { get; set; }
        public ICollection<NozzleRepair> NozzleRepairs { get; set; }
        public ICollection<EquipmentRepair> EquipmentRepairs { get; set; }
    }
}
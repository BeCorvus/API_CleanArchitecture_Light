using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FuelManagementSystem.Models
{
    public class Fuel : BaseEntity
    {
        [Key]
        public int ID_Fuel { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Brand { get; set; }
        
        public DateTime ExpiryDate { get; set; }
        
        [StringLength(100)]
        public string Manufacturer { get; set; }
        
        public decimal Cost { get; set; }
        
        // Навигационные свойства
        public ICollection<Nozzle> Nozzles { get; set; }
    }
}
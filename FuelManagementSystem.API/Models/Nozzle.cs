using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FuelManagementSystem.Models
{
    public class Nozzle : BaseEntity
    {
        [Key]
        public int ID_Nozzle { get; set; }
        
        public int Number { get; set; }
        
        [ForeignKey("FuelColumn")]
        public int ID_Column { get; set; }
        
        [ForeignKey("Fuel")]
        public int ID_Fuel { get; set; }
        
        public decimal FlowRate { get; set; }
        
        // Навигационные свойства
        public FuelColumn FuelColumn { get; set; }
        public Fuel Fuel { get; set; }
        public ICollection<NozzleRepair> NozzleRepairs { get; set; }
    }
}
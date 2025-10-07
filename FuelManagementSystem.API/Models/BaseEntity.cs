using System;

namespace FuelManagementSystem.Models
{
    public abstract class BaseEntity
    {
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public string CreatedBy { get; set; }
        public string ModifiedBy { get; set; }
        public string Note { get; set; }
        public bool IsDeleted { get; set; } = false;
    }
}


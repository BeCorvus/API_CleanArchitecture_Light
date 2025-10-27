using System;

namespace FuelManagementSystem.API.DTO
{
    public abstract class BaseEntityDTO
    {
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public string CreatedBy { get; set; }
        public string ModifiedBy { get; set; }
        public string Note { get; set; }
        public bool IsDeleted { get; set; } = false;
    }
}
namespace FuelManagementSystem.API.Models
{
    public abstract class BaseEntity : ISoftDelete
    {
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public string CreatedBy { get; set; }
        public string ModifiedBy { get; set; }
        public string Note { get; set; }
        public DateTime? WhenDeleted { get; set; }
    }
}
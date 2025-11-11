namespace FuelManagementSystem.API.Models
{
    public interface ISoftDelete
    {
        DateTime? WhenDeleted { get; set; }
    }
}
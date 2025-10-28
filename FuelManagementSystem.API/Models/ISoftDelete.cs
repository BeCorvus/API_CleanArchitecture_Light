namespace FuelManagementSystem.API.Models
{
    public interface ISoftDelete
    {
        bool IsDeleted { get; set; }
    }
}
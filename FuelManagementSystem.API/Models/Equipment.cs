namespace FuelManagementSystem.API.Models
{
    public partial class Equipment : ISoftDelete  // Добавляем интерфейс
    {
        public int IdEquipment { get; set; }
        public string? Name { get; set; }
        public string? Brand { get; set; }
        public int? IdGeyser { get; set; }
        public int? IdRepair { get; set; }
        public DateTime? DateOfRecording { get; set; }
        public DateTime? DateOfChange { get; set; }
        public string? WhoRecorded { get; set; }
        public string? WhoChanged { get; set; }
        public string? Note { get; set; }
        public DateTime? WhenDeleted { get; set; }

        public virtual ICollection<GeyserEquipment> GeyserEquipments { get; set; } = new List<GeyserEquipment>();
        public virtual ICollection<RepairEquipment> RepairEquipments { get; set; } = new List<RepairEquipment>();
    }
}
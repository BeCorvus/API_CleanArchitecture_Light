using System;
using System.Collections.Generic;

namespace FuelManagementSystem.API.Models;

public partial class Geyser : ISoftDelete
{
    public int IdGeyser { get; set; }

    public int? Name { get; set; }

    public int? YearOfRelease { get; set; }

    public int? IdRepair { get; set; }

    public int? IdFuel { get; set; }

    public string? Manufacturer { get; set; }

    public DateTime? DateOfRecording { get; set; }

    public DateTime? DateOfChange { get; set; }

    public string? WhoRecorded { get; set; }

    public string? WhoChanged { get; set; }

    public string? Note { get; set; }

    public bool IsDeleted { get; set; } = false;

    public virtual ICollection<GeyserEquipment> GeyserEquipments { get; set; } = new List<GeyserEquipment>();

    public virtual ICollection<GeyserFuel> GeyserFuels { get; set; } = new List<GeyserFuel>();

    public virtual ICollection<RepairGeyser> RepairGeysers { get; set; } = new List<RepairGeyser>();
}

using System;
using System.Collections.Generic;

namespace FuelManagementSystem.API.Models;

public partial class GeyserEquipment : ISoftDelete
{
    public int IdGeyserEquipment { get; set; }

    public int? IdGeyser { get; set; }

    public int? IdEquipment { get; set; }

    public DateTime? DateOfRecording { get; set; }

    public DateTime? DateOfChange { get; set; }

    public string? WhoRecorded { get; set; }

    public string? WhoChanged { get; set; }

    public string? Note { get; set; }

    public bool IsDeleted { get; set; } = false;

    public virtual Equipment? IdEquipmentNavigation { get; set; }

    public virtual Geyser? IdGeyserNavigation { get; set; }
}

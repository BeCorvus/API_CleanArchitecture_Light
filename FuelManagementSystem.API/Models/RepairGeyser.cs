using System;
using System.Collections.Generic;

namespace FuelManagementSystem.API.Models;

public partial class RepairGeyser
{
    public int IdRepairGeyser { get; set; }

    public int? IdRepair { get; set; }

    public int? IdGeyser { get; set; }

    public DateTime? DateOfRecording { get; set; }

    public DateTime? DateOfChange { get; set; }

    public string? WhoRecorded { get; set; }

    public string? WhoChanged { get; set; }

    public string? Note { get; set; }

    public virtual Geyser? IdGeyserNavigation { get; set; }

    public virtual Repair? IdRepairNavigation { get; set; }
}

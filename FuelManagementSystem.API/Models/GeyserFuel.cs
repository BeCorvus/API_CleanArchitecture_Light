using System;
using System.Collections.Generic;

namespace FuelManagementSystem.API.Models;

public partial class GeyserFuel : ISoftDelete
{
    public int IdGeyserFuel { get; set; }

    public int? IdGeyser { get; set; }

    public int? IdFuel { get; set; }

    public DateTime? DateOfRecording { get; set; }

    public DateTime? DateOfChange { get; set; }

    public string? WhoRecorded { get; set; }

    public string? WhoChanged { get; set; }

    public string? Note { get; set; }

    public DateTime? WhenDeleted { get; set; }

    public virtual Fuel? IdFuelNavigation { get; set; }

    public virtual Geyser? IdGeyserNavigation { get; set; }
}

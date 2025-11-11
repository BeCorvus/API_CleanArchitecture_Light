using System;
using System.Collections.Generic;

namespace FuelManagementSystem.API.Models;

public partial class Fuel : ISoftDelete
{
    public int IdFuel { get; set; }

    public string? Brand { get; set; }

    public int? ShelfLife { get; set; }

    public string? Manufacturer { get; set; }

    public decimal? Cost { get; set; }

    public DateTime? DateOfRecording { get; set; }

    public DateTime? DateOfChange { get; set; }

    public string? WhoRecorded { get; set; }

    public string? WhoChanged { get; set; }

    public string? Note { get; set; }

    public DateTime? WhenDeleted { get; set; }

    public virtual ICollection<GeyserFuel> GeyserFuels { get; set; } = new List<GeyserFuel>();
}

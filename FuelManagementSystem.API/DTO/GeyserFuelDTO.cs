using System;
using System.Collections.Generic;

namespace FuelManagementSystem.API.DTO;

public partial class GeyserFuelDTO
{
    public int IdGeyserFuel { get; set; }

    public int? IdGeyser { get; set; }

    public int? IdFuel { get; set; }

    public DateTime? DateOfRecording { get; set; }

    public DateTime? DateOfChange { get; set; }

    public string? WhoRecorded { get; set; }

    public string? WhoChanged { get; set; }

    public string? Note { get; set; }

}

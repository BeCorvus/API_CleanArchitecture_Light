using System;
using System.Collections.Generic;

namespace FuelManagementSystem.API.DTO;

public partial class RepairDTO
{
    public int IdRepair { get; set; }

    public string? Name { get; set; }

    public DateOnly? DateOfRepair { get; set; }

    public string? Manufacturer { get; set; }

    public DateOnly? ReleaseDate { get; set; }

    public string? Repairman { get; set; }

    public decimal? Cost { get; set; }

    public DateTime? DateOfRecording { get; set; }

    public DateTime? DateOfChange { get; set; }

    public string? WhoRecorded { get; set; }

    public string? WhoChanged { get; set; }

    public string? Note { get; set; }

}

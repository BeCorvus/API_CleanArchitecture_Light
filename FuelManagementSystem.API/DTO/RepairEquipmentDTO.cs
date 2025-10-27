using System;
using System.Collections.Generic;

namespace FuelManagementSystem.API.DTO;

public partial class RepairEquipmentDTO
{
    public int IdRepairEquipment { get; set; }

    public int? IdRepair { get; set; }

    public int? IdEquipment { get; set; }

    public DateTime? DateOfRecording { get; set; }

    public DateTime? DateOfChange { get; set; }

    public string? WhoRecorded { get; set; }

    public string? WhoChanged { get; set; }

    public string? Note { get; set; }

}

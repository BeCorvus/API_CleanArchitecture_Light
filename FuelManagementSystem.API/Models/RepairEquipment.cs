using System;
using System.Collections.Generic;

namespace FuelManagementSystem.API.Models;

public partial class RepairEquipment
{
    public int IdRepairEquipment { get; set; }

    public int? IdRepair { get; set; }

    public int? IdEquipment { get; set; }

    public DateTime? DateOfRecording { get; set; }

    public DateTime? DateOfChange { get; set; }

    public string? WhoRecorded { get; set; }

    public string? WhoChanged { get; set; }

    public string? Note { get; set; }

    public virtual Equipment? IdEquipmentNavigation { get; set; }

    public virtual Repair? IdRepairNavigation { get; set; }
}

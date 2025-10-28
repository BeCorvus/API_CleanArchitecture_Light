using System;
using System.Collections.Generic;

namespace FuelManagementSystem.API.Models;

public partial class Role : ISoftDelete
{
    public int IdRoles { get; set; }

    public string? NameRole { get; set; }

    public DateTime? DateOfRecording { get; set; }

    public DateTime? DateOfChange { get; set; }

    public string? WhoRecorded { get; set; }

    public string? WhoChanged { get; set; }

    public string? Note { get; set; }

    public bool IsDeleted { get; set; } = false;

    public virtual ICollection<UsersRole> UsersRoles { get; set; } = new List<UsersRole>();
}

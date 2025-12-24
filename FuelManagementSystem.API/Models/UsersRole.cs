using System;
using System.Collections.Generic;

namespace FuelManagementSystem.API.Models;

public partial class UsersRole : ISoftDelete
{
    public int IdUsersRoles { get; set; }

    public int? IdUsers { get; set; }

    public int? IdRoles { get; set; }

    public DateTime? DateOfRecording { get; set; }

    public DateTime? DateOfChange { get; set; }

    public string? WhoRecorded { get; set; }

    public string? WhoChanged { get; set; }

    public string? Note { get; set; }

    public DateTime? WhenDeleted { get; set; }

    public virtual Role? IdRolesNavigation { get; set; }

    public virtual User? IdUsersNavigation { get; set; }
}

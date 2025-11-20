using System;
using System.Collections.Generic;

namespace FuelManagementSystem.API.Models;

public partial class User : ISoftDelete
{
    public int IdUsers { get; set; }
    public string? Email { get; set; }
    public string? Login { get; set; }
    public string? PasswordHash { get; set; }
    public DateTime? DateOfRecording { get; set; }
    public DateTime? DateOfChange { get; set; }
    public string? WhoRecorded { get; set; }
    public string? WhoChanged { get; set; }
    public string? Note { get; set; }
    public DateTime? WhenDeleted { get; set; }


    public virtual ICollection<UsersRole> UsersRoles { get; set; } = new List<UsersRole>();
}

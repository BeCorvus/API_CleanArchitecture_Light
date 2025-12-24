using System;

namespace FuelManagementSystem.API.DTO;

// Для получения данных (GET) - базовый DTO
public class RoleDto
{
    public int Id { get; set; }
    public string NameRole { get; set; }
    public string Note { get; set; }
}

// Для создания (POST)    
public class CreateRoleDto
{
    public string NameRole { get; set; }
    public string Note { get; set; }
}

// Для обновления (PUT)    
public class UpdateRoleDto
{
    public string NameRole { get; set; }
    public string Note { get; set; }
}

// Для административных целей (все поля включая технические)
public class RoleAdminDto : RoleDto
{
    public DateTime? DateOfRecording { get; set; }
    public DateTime? DateOfChange { get; set; }
    public string WhoRecorded { get; set; }
    public string WhoChanged { get; set; }
    public DateTime? WhenDeleted { get; set; }
}
using System;

namespace FuelManagementSystem.API.DTO;

// Для получения данных (GET) - базовый DTO
public class UserDto
{
    public int Id { get; set; }
    public string Email { get; set; }
    public string Login { get; set; }
    public string Note { get; set; }
}

// Для создания (POST)    
public class CreateUserDto
{
    public string Email { get; set; }
    public string Login { get; set; }
    public string Password { get; set; }
    public string Note { get; set; }
}

// Для обновления (PUT)    
public class UpdateUserDto
{
    public string Email { get; set; }
    public string Login { get; set; }
    public string Password { get; set; }
    public string Note { get; set; }
}

// Для административных целей (все поля включая технические)
public class UserAdminDto : UserDto
{
    public DateTime? DateOfRecording { get; set; }
    public DateTime? DateOfChange { get; set; }
    public string WhoRecorded { get; set; }
    public string WhoChanged { get; set; }
    public DateTime? WhenDeleted { get; set; }
}
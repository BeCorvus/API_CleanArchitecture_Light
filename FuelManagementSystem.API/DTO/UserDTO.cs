using System;
using System.ComponentModel.DataAnnotations;

namespace FuelManagementSystem.API.DTO;

// Для получения данных (GET) - базовый DTO
public class UserDto
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = null!;

    [Required(ErrorMessage = "Login is required")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Login must be between 3 and 50 characters")]
    public string Login { get; set; } = null!;

    public string? Note { get; set; }

    // ✅ ДОБАВЛЕНО: Роль пользователя
    public string? Role { get; set; }
}

// Для создания пользователя в UserController (отличается от RegisterDto в AuthController)
public class CreateUserDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = null!;

    [Required(ErrorMessage = "Login is required")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Login must be between 3 and 50 characters")]
    public string Login { get; set; } = null!;

    [Required(ErrorMessage = "Password is required")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
    public string Password { get; set; } = null!;

    public string? Note { get; set; }
}

// Для обновления пользователя
public class UpdateUserDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = null!;

    [Required(ErrorMessage = "Login is required")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Login must be between 3 and 50 characters")]
    public string Login { get; set; } = null!;

    [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
    public string? Password { get; set; }

    public string? Note { get; set; }
}

// Для административных целей (все поля включая технические)
public class UserAdminDto : UserDto
{
    public DateTime? DateOfRecording { get; set; }
    public DateTime? DateOfChange { get; set; }
    public string? WhoRecorded { get; set; }
    public string? WhoChanged { get; set; }
    public DateTime? WhenDeleted { get; set; }
    public string? RoleName { get; set; }
    public int? RoleId { get; set; }
}

// Для пользователя с информацией о роли
public class UserWithRoleDto : UserDto
{
    public string? RoleName { get; set; }
    public int? RoleId { get; set; }
}

// Для изменения роли пользователя
public class ChangeUserRoleDto
{
    [Required(ErrorMessage = "Role ID is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Invalid role ID")]
    public int RoleId { get; set; }

    public string? Note { get; set; }
}

// Для проверки доступности email/login
public class CheckAvailabilityDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = null!;

    [Required(ErrorMessage = "Login is required")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Login must be between 3 and 50 characters")]
    public string Login { get; set; } = null!;
}
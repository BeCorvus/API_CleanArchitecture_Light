using Microsoft.AspNetCore.Mvc;
using FuelManagementSystem.API.DTO;
using FuelManagementSystem.API.Models;
using FuelManagementSystem.API.Repositories;
using FuelManagementSystem.API.Services;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;

namespace FuelManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordService _passwordService;
        private readonly IUserRoleService _userRoleService;
        private readonly IRoleRepository _roleRepository;

        public UserController(
            IUserRepository userRepository,
            IPasswordService passwordService,
            IUserRoleService userRoleService,
            IRoleRepository roleRepository)
        {
            _userRepository = userRepository;
            _passwordService = passwordService;
            _userRoleService = userRoleService;
            _roleRepository = roleRepository;
        }

        // GET: api/user
        [Authorize]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUsers()
        {
            var users = await _userRepository.GetAllActiveAsync();

            var userDtos = new List<UserDto>();
            foreach (var user in users)
            {
                var roleName = await _userRoleService.GetUserRoleNameAsync(user.IdUsers);

                userDtos.Add(new UserDto
                {
                    Id = user.IdUsers,
                    Email = user.Email,
                    Login = user.Login,
                    Note = user.Note,
                    Role = roleName // ✅ ДОБАВЛЕНО ПОЛЕ РОЛИ
                });
            }

            return Ok(userDtos);
        }

        // GET: api/user/{id}
        [Authorize]
        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUserById(int id)
        {
            var user = await _userRepository.GetActiveByIdAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            var roleName = await _userRoleService.GetUserRoleNameAsync(id);

            var userDto = new UserDto
            {
                Id = user.IdUsers,
                Email = user.Email,
                Login = user.Login,
                Note = user.Note,
                Role = roleName // ✅ ДОБАВЛЕНО ПОЛЕ РОЛИ
            };

            return Ok(userDto);
        }

        // GET: api/user/email/{email}
        [Authorize]
        [HttpGet("email/{email}")]
        public async Task<ActionResult<UserDto>> GetUserByEmail(string email)
        {
            var user = await _userRepository.GetByEmailAsync(email);

            if (user == null)
            {
                return NotFound();
            }

            var roleName = await _userRoleService.GetUserRoleNameAsync(user.IdUsers);

            var userDto = new UserDto
            {
                Id = user.IdUsers,
                Email = user.Email,
                Login = user.Login,
                Note = user.Note,
                Role = roleName // ✅ ДОБАВЛЕНО ПОЛЕ РОЛИ
            };

            return Ok(userDto);
        }

        // GET: api/user/login/{login}
        [Authorize]
        [HttpGet("login/{login}")]
        public async Task<ActionResult<UserDto>> GetUserByLogin(string login)
        {
            var user = await _userRepository.GetByLoginAsync(login);

            if (user == null)
            {
                return NotFound();
            }

            var roleName = await _userRoleService.GetUserRoleNameAsync(user.IdUsers);

            var userDto = new UserDto
            {
                Id = user.IdUsers,
                Email = user.Email,
                Login = user.Login,
                Note = user.Note,
                Role = roleName // ✅ ДОБАВЛЕНО ПОЛЕ РОЛИ
            };

            return Ok(userDto);
        }

        // GET: api/user/admin
        [Authorize]
        [HttpGet("admin")]
        public async Task<ActionResult<IEnumerable<UserAdminDto>>> GetAllUsersForAdmin()
        {
            var users = await _userRepository.GetAllAsync();

            var userAdminDtos = new List<UserAdminDto>();
            foreach (var user in users)
            {
                var roleName = await _userRoleService.GetUserRoleNameAsync(user.IdUsers);

                userAdminDtos.Add(new UserAdminDto
                {
                    Id = user.IdUsers,
                    Email = user.Email,
                    Login = user.Login,
                    Note = user.Note,
                    DateOfRecording = user.DateOfRecording,
                    DateOfChange = user.DateOfChange,
                    WhoRecorded = user.WhoRecorded,
                    WhoChanged = user.WhoChanged,
                    WhenDeleted = user.WhenDeleted,
                    RoleName = roleName
                });
            }

            return Ok(userAdminDtos);
        }

        // POST: api/user
        [AllowAnonymous]
        [HttpPost]
        public async Task<ActionResult<UserDto>> CreateUser(CreateUserDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Проверка на уникальность email и login
            var existingUser = await _userRepository.UserExistsAsync(createDto.Email, createDto.Login);
            if (existingUser)
            {
                return BadRequest("User with this email or login already exists.");
            }

            var user = new User
            {
                Email = createDto.Email,
                Login = createDto.Login,
                PasswordHash = _passwordService.HashPassword(createDto.Password),
                Note = createDto.Note,
                DateOfRecording = DateTime.Now,
                WhoRecorded = "System",
                WhenDeleted = null
            };

            await _userRepository.AddAsync(user);

            // АВТОМАТИЧЕСКОЕ НАЗНАЧЕНИЕ РОЛИ "user" ПОСЛЕ СОЗДАНИЯ ПОЛЬЗОВАТЕЛЯ
            await _userRoleService.AssignDefaultRoleToUserAsync(user.IdUsers, "System");

            var roleName = await _userRoleService.GetUserRoleNameAsync(user.IdUsers);

            var userDto = new UserDto
            {
                Id = user.IdUsers,
                Email = user.Email,
                Login = user.Login,
                Note = user.Note,
                Role = roleName // ✅ ДОБАВЛЕНО ПОЛЕ РОЛИ
            };

            return CreatedAtAction(nameof(GetUserById), new { id = user.IdUsers }, userDto);
        }

        // PUT: api/user/{id}
        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userRepository.GetActiveByIdAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            // Проверка на уникальность email (если изменяется)
            if (user.Email != updateDto.Email)
            {
                var existingUserByEmail = await _userRepository.GetByEmailAsync(updateDto.Email);
                if (existingUserByEmail != null && existingUserByEmail.IdUsers != id)
                {
                    return BadRequest("User with this email already exists.");
                }
            }

            // Проверка на уникальность login (если изменяется)
            if (user.Login != updateDto.Login)
            {
                var existingUserByLogin = await _userRepository.GetByLoginAsync(updateDto.Login);
                if (existingUserByLogin != null && existingUserByLogin.IdUsers != id)
                {
                    return BadRequest("User with this login already exists.");
                }
            }

            user.Email = updateDto.Email;
            user.Login = updateDto.Login;
            user.Note = updateDto.Note;
            user.DateOfChange = DateTime.Now;
            user.WhoChanged = "System";

            // Обновляем пароль только если он предоставлен
            if (!string.IsNullOrEmpty(updateDto.Password))
            {
                user.PasswordHash = _passwordService.HashPassword(updateDto.Password);
            }

            await _userRepository.UpdateAsync(user);

            return NoContent();
        }

        // PATCH: api/user/change-password/{id}
        [Authorize]
        [HttpPatch("change-password/{id}")]
        public async Task<IActionResult> ChangePassword(int id, ChangePasswordDto changePasswordDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (changePasswordDto.NewPassword != changePasswordDto.ConfirmNewPassword)
            {
                return BadRequest("New password and confirmation password do not match.");
            }

            var user = await _userRepository.GetActiveByIdAsync(id);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            // Обновление пароля
            user.PasswordHash = _passwordService.HashPassword(changePasswordDto.NewPassword);
            user.DateOfChange = DateTime.Now;
            user.WhoChanged = "System";

            await _userRepository.UpdateAsync(user);

            return Ok("Password changed successfully.");
        }

        // DELETE: api/user/{id} (Soft Delete)
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> SoftDeleteUser(int id)
        {
            var user = await _userRepository.GetActiveByIdAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            await _userRepository.SoftDeleteAsync(id);

            return NoContent();
        }

        // PATCH: api/user/restore/{id}
        [Authorize]
        [HttpPatch("restore/{id}")]
        public async Task<IActionResult> RestoreUser(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            if (user.WhenDeleted == null)
            {
                return BadRequest("User is not deleted.");
            }

            await _userRepository.RestoreAsync(id);

            return NoContent();
        }

        // GET: api/user/admin/{id}
        [Authorize]
        [HttpGet("admin/{id}")]
        public async Task<ActionResult<UserAdminDto>> GetUserByIdForAdmin(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            var roleName = await _userRoleService.GetUserRoleNameAsync(id);

            var userAdminDto = new UserAdminDto
            {
                Id = user.IdUsers,
                Email = user.Email,
                Login = user.Login,
                Note = user.Note,
                DateOfRecording = user.DateOfRecording,
                DateOfChange = user.DateOfChange,
                WhoRecorded = user.WhoRecorded,
                WhoChanged = user.WhoChanged,
                WhenDeleted = user.WhenDeleted,
                RoleName = roleName
            };

            return Ok(userAdminDto);
        }

        // GET: api/user/with-roles
        [Authorize]
        [HttpGet("with-roles")]
        public async Task<ActionResult<IEnumerable<UserWithRoleDto>>> GetUsersWithRoles()
        {
            var usersWithRoles = await _userRoleService.GetUsersWithRolesAsync();
            return Ok(usersWithRoles);
        }

        // GET: api/user/{id}/with-role
        [Authorize]
        [HttpGet("{id}/with-role")]
        public async Task<ActionResult<UserWithRoleDto>> GetUserWithRole(int id)
        {
            var userWithRole = await _userRoleService.GetUserWithRoleAsync(id);

            if (userWithRole == null)
            {
                return NotFound();
            }

            return Ok(userWithRole);
        }

        // GET: api/user/{id}/role
        [Authorize]
        [HttpGet("{id}/role")]
        public async Task<ActionResult> GetUserRole(int id)
        {
            var roleName = await _userRoleService.GetUserRoleNameAsync(id);
            var roleId = await _userRoleService.GetUserRoleIdAsync(id);

            return Ok(new
            {
                RoleName = roleName,
                RoleId = roleId
            });
        }

        // PUT: api/user/{id}/role (только для админов)
        [Authorize(Roles = "admin")]
        [HttpPut("{id}/role")]
        public async Task<IActionResult> ChangeUserRole(int id, ChangeUserRoleDto changeRoleDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Проверяем, существует ли роль
            var role = await _roleRepository.GetActiveByIdAsync(changeRoleDto.RoleId);
            if (role == null)
            {
                return BadRequest("Role not found");
            }

            // Получаем текущего пользователя (админа) из контекста
            var currentUserLogin = User.Identity?.Name ?? "System";

            var result = await _userRoleService.UpdateUserRoleAsync(id, changeRoleDto.RoleId, currentUserLogin);

            if (!result)
            {
                return BadRequest("Failed to update user role");
            }

            return Ok(new { Message = "User role updated successfully" });
        }

        // DELETE: api/user/{userId}/role/{roleId} (только для админов)
        [Authorize(Roles = "admin")]
        [HttpDelete("{userId}/role/{roleId}")]
        public async Task<IActionResult> RemoveUserRole(int userId, int roleId)
        {
            // Получаем текущего пользователя (админа) из контекста
            var currentUserLogin = User.Identity?.Name ?? "System";

            var result = await _userRoleService.RemoveUserFromRoleAsync(userId, roleId, currentUserLogin);

            if (!result)
            {
                return BadRequest("Failed to remove role from user");
            }

            return Ok(new { Message = "Role removed from user successfully" });
        }

        // GET: api/user/{id}/is-admin
        [Authorize]
        [HttpGet("{id}/is-admin")]
        public async Task<ActionResult> IsUserAdmin(int id)
        {
            var isAdmin = await _userRoleService.IsUserAdminAsync(id);
            return Ok(new { IsAdmin = isAdmin });
        }

        // Добавляем метод для проверки доступности email/login
        [AllowAnonymous]
        [HttpPost("check-availability")]
        public async Task<ActionResult> CheckAvailability(CheckAvailabilityDto checkDto)
        {
            var exists = await _userRepository.UserExistsAsync(checkDto.Email, checkDto.Login);
            return Ok(new { available = !exists });
        }
    }

    // DTO для смены пароля
    public class ChangePasswordDto
    {
        public string? CurrentPassword { get; set; }

        [Required]
        public string NewPassword { get; set; }

        [Required]
        public string ConfirmNewPassword { get; set; }
    }

    // DTO для проверки доступности
    public class CheckAvailabilityDto
    {
        public string Email { get; set; }
        public string Login { get; set; }
    }

    // DTO для изменения роли пользователя
    public class ChangeUserRoleDto
    {
        [Required(ErrorMessage = "Role ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Invalid role ID")]
        public int RoleId { get; set; }

        public string? Note { get; set; }
    }
}
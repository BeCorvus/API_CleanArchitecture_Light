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

        public UserController(IUserRepository userRepository, IPasswordService passwordService)
        {
            _userRepository = userRepository;
            _passwordService = passwordService;
        }

        // GET: api/user
        [Authorize]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUsers()
        {
            var users = await _userRepository.GetAllActiveAsync();

            var userDtos = users.Select(u => new UserDto
            {
                Id = u.IdUsers,
                Email = u.Email,
                Login = u.Login,
                Note = u.Note
            });

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

            var userDto = new UserDto
            {
                Id = user.IdUsers,
                Email = user.Email,
                Login = user.Login,
                Note = user.Note
            };

            return Ok(userDto);
        }

        // GET: api/user/email/{email}
        [Authorize]
        [HttpGet("email/{email}")]
        public async Task<ActionResult<UserDto>> GetUserByEmail(string email) // Изменен возвращаемый тип
        {
            var user = await _userRepository.GetByEmailAsync(email);

            if (user == null)
            {
                return NotFound();
            }

            var userDto = new UserDto
            {
                Id = user.IdUsers,
                Email = user.Email,
                Login = user.Login,
                Note = user.Note
            };

            return Ok(userDto);
        }

        // GET: api/user/login/{login}
        [Authorize]
        [HttpGet("login/{login}")]
        public async Task<ActionResult<UserDto>> GetUserByLogin(string login) // Изменен возвращаемый тип
        {
            var user = await _userRepository.GetByLoginAsync(login);

            if (user == null)
            {
                return NotFound();
            }

            var userDto = new UserDto
            {
                Id = user.IdUsers,
                Email = user.Email,
                Login = user.Login,
                Note = user.Note
            };

            return Ok(userDto);
        }

        // GET: api/user/admin
        [Authorize]
        [HttpGet("admin")]
        public async Task<ActionResult<IEnumerable<UserAdminDto>>> GetAllUsersForAdmin()
        {
            var users = await _userRepository.GetAllAsync();

            var userAdminDtos = users.Select(u => new UserAdminDto
            {
                Id = u.IdUsers,
                Email = u.Email,
                Login = u.Login,
                Note = u.Note,
                DateOfRecording = u.DateOfRecording,
                DateOfChange = u.DateOfChange,
                WhoRecorded = u.WhoRecorded,
                WhoChanged = u.WhoChanged,
                WhenDeleted = u.WhenDeleted
            });

            return Ok(userAdminDtos);
        }

        // POST: api/user
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

            var userDto = new UserDto
            {
                Id = user.IdUsers,
                Email = user.Email,
                Login = user.Login,
                Note = user.Note
            };

            return CreatedAtAction(nameof(GetUserById), new { id = user.IdUsers }, userDto);
        }

        // PUT: api/user/{id}
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
        [HttpGet("admin/{id}")]
        public async Task<ActionResult<UserAdminDto>> GetUserByIdForAdmin(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);

            if (user == null)
            {
                return NotFound();
            }

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
                WhenDeleted = user.WhenDeleted
            };

            return Ok(userAdminDto);
        }

        // Добавляем метод для проверки доступности email/login
        [AllowAnonymous] // Этот метод должен быть доступен без авторизации
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
}
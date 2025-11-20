using Microsoft.AspNetCore.Mvc;
using FuelManagementSystem.API.DTO;
using FuelManagementSystem.API.Models;
using FuelManagementSystem.API.Repositories;
using FuelManagementSystem.API.Services;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace FuelManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IJwtService _jwtService;
        private readonly IPasswordService _passwordService;

        public AuthController(IUserRepository userRepository, IJwtService jwtService, IPasswordService passwordService)
        {
            _userRepository = userRepository;
            _jwtService = jwtService;
            _passwordService = passwordService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (registerDto.Password != registerDto.ConfirmPassword)
            {
                return BadRequest("Password and confirmation password do not match.");
            }

            // Проверка на существование пользователя
            var existingUser = await _userRepository.UserExistsAsync(registerDto.Email, registerDto.Login);
            if (existingUser)
            {
                return BadRequest("User with this email or login already exists.");
            }

            // Создание нового пользователя
            var user = new User
            {
                Email = registerDto.Email,
                Login = registerDto.Login,
                PasswordHash = _passwordService.HashPassword(registerDto.Password),
                Note = registerDto.Note,
                DateOfRecording = DateTime.Now,
                WhoRecorded = "System",
                WhenDeleted = null
            };

            await _userRepository.AddAsync(user);

            // Генерация токена
            var token = _jwtService.GenerateToken(user);

            var userDto = new UserDto
            {
                Id = user.IdUsers,
                Email = user.Email,
                Login = user.Login,
                Note = user.Note
            };

            var response = new AuthResponseDto
            {
                Token = token,
                Expiration = DateTime.Now.AddMinutes(60), // Должно соответствовать настройкам JWT
                User = userDto
            };

            return Ok(response);
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Поиск пользователя по email
            var user = await _userRepository.GetByEmailAsync(loginDto.Email);
            if (user == null)
            {
                return Unauthorized("Invalid email or password.");
            }

            // Проверка пароля
            if (!_passwordService.VerifyPassword(loginDto.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid email or password.");
            }

            // Генерация токена
            var token = _jwtService.GenerateToken(user);

            var userDto = new UserDto
            {
                Id = user.IdUsers,
                Email = user.Email,
                Login = user.Login,
                Note = user.Note
            };

            var response = new AuthResponseDto
            {
                Token = token,
                Expiration = DateTime.Now.AddMinutes(60),
                User = userDto
            };

            return Ok(response);
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto changePasswordDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (changePasswordDto.NewPassword != changePasswordDto.ConfirmNewPassword)
            {
                return BadRequest("New password and confirmation password do not match.");
            }

            // Получение ID пользователя из токена (будет работать после добавления авторизации)
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var user = await _userRepository.GetActiveByIdAsync(userId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            // Проверка текущего пароля
            if (!_passwordService.VerifyPassword(changePasswordDto.CurrentPassword, user.PasswordHash))
            {
                return BadRequest("Current password is incorrect.");
            }

            // Обновление пароля
            user.PasswordHash = _passwordService.HashPassword(changePasswordDto.NewPassword);
            user.DateOfChange = DateTime.Now;
            user.WhoChanged = "System";

            await _userRepository.UpdateAsync(user);

            return Ok("Password changed successfully.");
        }
    }
}
using Microsoft.AspNetCore.Mvc;
using FuelManagementSystem.API.DTO;
using FuelManagementSystem.API.Models;
using FuelManagementSystem.API.Repositories;
using FuelManagementSystem.API.Services;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace FuelManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IJwtService _jwtService;
        private readonly IPasswordService _passwordService;
        private readonly IEmailService _emailService;

        public AuthController(IUserRepository userRepository, IJwtService jwtService,
                                    IPasswordService passwordService, IEmailService emailService)
        {
            _userRepository = userRepository;
            _jwtService = jwtService;
            _passwordService = passwordService;
            _emailService = emailService;
        }

        [AllowAnonymous]
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

        [AllowAnonymous]
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

        [Authorize]
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

        [AllowAnonymous]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordDto forgotPasswordDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Поиск пользователя по email
            var user = await _userRepository.GetByEmailAsync(forgotPasswordDto.Email);
            if (user == null)
            {
                // В целях безопасности не сообщаем, что пользователь не найден
                return Ok("If the email is registered, a password reset link has been sent.");
            }

            // Генерация токена сброса пароля
            var resetToken = GeneratePasswordResetToken();
            var tokenExpiry = DateTime.UtcNow.AddHours(1); // Токен действует 1 час

            // Сохранение токена в базе данных (добавьте поле ResetToken в модель User)
            user.ResetToken = resetToken;
            user.ResetTokenExpiry = tokenExpiry;
            user.DateOfChange = DateTime.Now;
            user.WhoChanged = "System";

            await _userRepository.UpdateAsync(user);

            // Отправка email с ссылкой для сброса пароля
            try
            {
                await _emailService.SendPasswordResetEmail(user.Email, resetToken);
                return Ok("If the email is registered, a password reset link has been sent.");
            }
            catch (Exception ex)
            {
                // Логируем ошибку, но не раскрываем детали пользователю
                Console.WriteLine($"Error sending email: {ex.Message}");
                return StatusCode(500, "Error sending reset email. Please try again later.");
            }
        }

        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto resetPasswordDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (resetPasswordDto.NewPassword != resetPasswordDto.ConfirmNewPassword)
            {
                return BadRequest("New password and confirmation password do not match.");
            }

            // Поиск пользователя по токену сброса
            var user = await _userRepository.GetByResetTokenAsync(resetPasswordDto.Token);
            if (user == null || user.ResetTokenExpiry < DateTime.UtcNow)
            {
                return BadRequest("Invalid or expired reset token.");
            }

            // Сброс пароля
            user.PasswordHash = _passwordService.HashPassword(resetPasswordDto.NewPassword);
            user.ResetToken = null; // Очищаем токен после использования
            user.ResetTokenExpiry = null;
            user.DateOfChange = DateTime.Now;
            user.WhoChanged = "System";

            await _userRepository.UpdateAsync(user);

            return Ok("Password has been reset successfully. You can now login with your new password.");
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            // В JWT нет состояния, поэтому на сервере мы не можем "удалить" токен
            // Клиент должен удалить токен со своей стороны
            // В продвинутых сценариях можно использовать blacklist токенов

            // Здесь можно добавить логику для blacklist, если требуется
            // Например, сохранить токен в базу данных недействительных токенов
            // до истечения его срока действия

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

            // Логируем выход пользователя (опционально)
            Console.WriteLine($"User {userId} logged out at {DateTime.Now}");

            return Ok(new { message = "Logout successful. Please remove the token on the client side." });
        }

        [Authorize]
        [HttpPost("validate-token")]
        public IActionResult ValidateToken()
        {
            // Простой endpoint для проверки валидности токена
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;

            return Ok(new
            {
                isValid = true,
                userId = userId,
                userEmail = userEmail,
                message = "Token is valid"
            });
        }

        private string GeneratePasswordResetToken()
        {
            // Генерация случайного токена
            return Convert.ToBase64String(Guid.NewGuid().ToByteArray())
                         .Replace("+", "")
                         .Replace("/", "")
                         .Replace("=", "");
        }
    }
}
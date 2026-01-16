using Microsoft.AspNetCore.Mvc;
using FuelManagementSystem.API.DTO;
using FuelManagementSystem.API.Models;
using FuelManagementSystem.API.Repositories;
using FuelManagementSystem.API.Services;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using System.Net.Mail;

namespace FuelManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private const int TOKEN_EXPIRATION_MINUTES = 60;
        private const int RESET_TOKEN_EXPIRATION_HOURS = 1;

        private readonly IUserRepository _userRepository;
        private readonly IJwtService _jwtService;
        private readonly IPasswordService _passwordService;
        private readonly IEmailService _emailService;
        private readonly IUserRoleService _userRoleService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IUserRepository userRepository,
            IJwtService jwtService,
            IPasswordService passwordService,
            IEmailService emailService,
            IUserRoleService userRoleService,
            ILogger<AuthController> logger)
        {
            _userRepository = userRepository;
            _jwtService = jwtService;
            _passwordService = passwordService;
            _emailService = emailService;
            _userRoleService = userRoleService;
            _logger = logger;
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto registerDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                if (registerDto.Password != registerDto.ConfirmPassword)
                {
                    return BadRequest("Password and confirmation password do not match.");
                }

                if (!IsPasswordValid(registerDto.Password))
                {
                    return BadRequest("Password must be at least 8 characters long and contain uppercase, lowercase, and numbers.");
                }

                if (!IsValidEmail(registerDto.Email))
                {
                    return BadRequest("Invalid email format.");
                }

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
                    DateOfRecording = DateTime.UtcNow,
                    WhoRecorded = "System",
                    WhenDeleted = null
                };

                await _userRepository.AddAsync(user);

                // ✅ АВТОМАТИЧЕСКОЕ НАЗНАЧЕНИЕ РОЛИ "user" ПРИ РЕГИСТРАЦИИ
                try
                {
                    await _userRoleService.AssignDefaultRoleToUserAsync(user.IdUsers, "System");
                    _logger.LogInformation($"Default role assigned to user {user.IdUsers} ({user.Email})");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to assign default role to user {user.IdUsers}");

                    // Откат создания пользователя, если не удалось назначить роль
                    await _userRepository.SoftDeleteAsync(user.IdUsers);
                    return StatusCode(500, "Failed to complete user registration. Please try again.");
                }

                // Получение роли пользователя для включения в токен
                string roleName = "user"; // По умолчанию
                try
                {
                    var role = await _userRoleService.GetUserRoleNameAsync(user.IdUsers);
                    if (!string.IsNullOrEmpty(role))
                    {
                        roleName = role;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Could not get role name for user {user.IdUsers}, using default");
                }

                // Генерация токена с ролью
                var token = _jwtService.GenerateToken(user, roleName);

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
                    Expiration = DateTime.UtcNow.AddMinutes(TOKEN_EXPIRATION_MINUTES),
                    User = userDto
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during user registration");
                return StatusCode(500, "An error occurred during registration.");
            }
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                User? user = null;

                if (loginDto.Login.Contains("@"))
                {
                    user = await _userRepository.GetByEmailAsync(loginDto.Login);
                }
                else
                {
                    user = await _userRepository.GetByUsernameAsync(loginDto.Login);
                }

                if (user == null)
                {
                    return Unauthorized("Неверные учетные данные.");
                }

                if (!_passwordService.VerifyPassword(loginDto.Password, user.PasswordHash))
                {
                    return Unauthorized("Неверные учетные данные.");
                }

                if (user.WhenDeleted != null)
                {
                    return Unauthorized("User account is deactivated.");
                }

                // Получение роли пользователя для включения в токен
                string roleName = "user"; // По умолчанию
                try
                {
                    var role = await _userRoleService.GetUserRoleNameAsync(user.IdUsers);
                    if (!string.IsNullOrEmpty(role))
                    {
                        roleName = role;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Could not get role name for user {user.IdUsers}, using default");
                }

                // Генерация токена с ролью
                var token = _jwtService.GenerateToken(user, roleName);

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
                    Expiration = DateTime.UtcNow.AddMinutes(TOKEN_EXPIRATION_MINUTES),
                    User = userDto
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during user login");
                return StatusCode(500, "An error occurred during login.");
            }
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto changePasswordDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                if (changePasswordDto.NewPassword != changePasswordDto.ConfirmNewPassword)
                {
                    return BadRequest("New password and confirmation password do not match.");
                }

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var user = await _userRepository.GetActiveByIdAsync(userId);

                if (user == null)
                {
                    return NotFound("User not found.");
                }

                if (!_passwordService.VerifyPassword(changePasswordDto.CurrentPassword, user.PasswordHash))
                {
                    return BadRequest("Current password is incorrect.");
                }

                user.PasswordHash = _passwordService.HashPassword(changePasswordDto.NewPassword);
                user.DateOfChange = DateTime.UtcNow;
                user.WhoChanged = "System";

                await _userRepository.UpdateAsync(user);

                return Ok("Password changed successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password change");
                return StatusCode(500, "An error occurred during password change.");
            }
        }

        [AllowAnonymous]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordDto forgotPasswordDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var user = await _userRepository.GetByEmailAsync(forgotPasswordDto.Email);
                if (user == null)
                {
                    return Ok("If the email is registered, a password reset link has been sent.");
                }

                if (user.WhenDeleted != null)
                {
                    return BadRequest("User account is deactivated.");
                }

                var resetToken = GeneratePasswordResetToken();
                var tokenExpiry = DateTime.UtcNow.AddHours(RESET_TOKEN_EXPIRATION_HOURS);

                user.ResetToken = resetToken;
                user.ResetTokenExpiry = tokenExpiry;
                user.DateOfChange = DateTime.UtcNow;
                user.WhoChanged = "System";

                await _userRepository.UpdateAsync(user);

                try
                {
                    await _emailService.SendPasswordResetEmail(user.Email, resetToken);
                    return Ok("If the email is registered, a password reset link has been sent.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending password reset email");
                    return StatusCode(500, "Error sending reset email. Please try again later.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during forgot password");
                return StatusCode(500, "An error occurred during password reset request.");
            }
        }

        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto resetPasswordDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                if (resetPasswordDto.NewPassword != resetPasswordDto.ConfirmNewPassword)
                {
                    return BadRequest("New password and confirmation password do not match.");
                }

                var user = await _userRepository.GetByResetTokenAsync(resetPasswordDto.Token);
                if (user == null || user.ResetTokenExpiry < DateTime.UtcNow)
                {
                    return BadRequest("Invalid or expired reset token.");
                }

                user.PasswordHash = _passwordService.HashPassword(resetPasswordDto.NewPassword);
                user.ResetToken = null;
                user.ResetTokenExpiry = null;
                user.DateOfChange = DateTime.UtcNow;
                user.WhoChanged = "System";

                await _userRepository.UpdateAsync(user);

                return Ok("Password has been reset successfully. You can now login with your new password.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password reset");
                return StatusCode(500, "An error occurred during password reset.");
            }
        }

        [Authorize]
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                _logger.LogInformation($"User {userId} logged out at {DateTime.UtcNow}");

                return Ok(new { message = "Logout successful. Please remove the token on the client side." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout");
                return StatusCode(500, "An error occurred during logout.");
            }
        }

        [Authorize]
        [HttpPost("validate-token")]
        public IActionResult ValidateToken()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                return Ok(new
                {
                    isValid = true,
                    userId = userId,
                    userEmail = userEmail,
                    userRole = userRole,
                    message = "Token is valid"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating token");
                return StatusCode(500, "An error occurred during token validation.");
            }
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<ActionResult<UserWithRoleDto>> GetUserProfile()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var userWithRole = await _userRoleService.GetUserWithRoleAsync(userId);

                if (userWithRole == null)
                {
                    return NotFound("User not found.");
                }

                return Ok(userWithRole);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user profile");
                return StatusCode(500, "An error occurred while getting user profile.");
            }
        }

        [Authorize]
        [HttpGet("is-admin")]
        public async Task<ActionResult> IsAdmin()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var isAdmin = await _userRoleService.IsUserAdminAsync(userId);

                return Ok(new { IsAdmin = isAdmin });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking admin status");
                return StatusCode(500, "An error occurred while checking admin status.");
            }
        }

        private string GeneratePasswordResetToken()
        {
            return Convert.ToBase64String(Guid.NewGuid().ToByteArray())
                         .Replace("+", "")
                         .Replace("/", "")
                         .Replace("=", "");
        }

        private bool IsPasswordValid(string password)
        {
            if (string.IsNullOrWhiteSpace(password) || password.Length < 6)
                return false;

            return true;
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }
}
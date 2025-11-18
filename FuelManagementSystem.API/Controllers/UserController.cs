using Microsoft.AspNetCore.Mvc;
using FuelManagementSystem.API.DTO;
using FuelManagementSystem.API.Models;
using FuelManagementSystem.API.Repositories;
using System.ComponentModel.DataAnnotations;

namespace FuelManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public UserController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        // GET: api/user
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
        [HttpGet("email/{email}")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUserByEmail(string email)
        {
            var users = await _userRepository.GetByEmailAsync(email);

            var userDtos = users.Select(u => new UserDto
            {
                Id = u.IdUsers,
                Email = u.Email,
                Login = u.Login,
                Note = u.Note
            });

            return Ok(userDtos);
        }

        // GET: api/user/login/{login}
        [HttpGet("login/{login}")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUserByLogin(string login)
        {
            var users = await _userRepository.GetByLoginAsync(login);

            var userDtos = users.Select(u => new UserDto
            {
                Id = u.IdUsers,
                Email = u.Email,
                Login = u.Login,
                Note = u.Note
            });

            return Ok(userDtos);
        }

        // POST: api/user/authenticate
        [HttpPost("authenticate")]
        public async Task<ActionResult<UserDto>> AuthenticateUser([FromBody] AuthenticateUserDto authDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userRepository.GetByEmailAndPasswordAsync(authDto.Email, authDto.Password);

            if (user == null)
            {
                return Unauthorized("Invalid email or password");
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
            var existingEmail = await _userRepository.GetByEmailAsync(createDto.Email);
            if (existingEmail.Any())
            {
                return BadRequest("User with this email already exists.");
            }

            var existingLogin = await _userRepository.GetByLoginAsync(createDto.Login);
            if (existingLogin.Any())
            {
                return BadRequest("User with this login already exists.");
            }

            var user = new User
            {
                Email = createDto.Email,
                Login = createDto.Login,
                Password = createDto.Password, // В реальном приложении пароль должен быть захэширован
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
                var existingEmail = await _userRepository.GetByEmailAsync(updateDto.Email);
                if (existingEmail.Any(u => u.IdUsers != id))
                {
                    return BadRequest("User with this email already exists.");
                }
            }

            // Проверка на уникальность login (если изменяется)
            if (user.Login != updateDto.Login)
            {
                var existingLogin = await _userRepository.GetByLoginAsync(updateDto.Login);
                if (existingLogin.Any(u => u.IdUsers != id))
                {
                    return BadRequest("User with this login already exists.");
                }
            }

            user.Email = updateDto.Email;
            user.Login = updateDto.Login;
            user.Password = updateDto.Password; // В реальном приложении пароль должен быть захэширован
            user.Note = updateDto.Note;
            user.DateOfChange = DateTime.Now;
            user.WhoChanged = "System";

            await _userRepository.UpdateAsync(user);

            return NoContent();
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
    }

    // DTO для аутентификации
    public class AuthenticateUserDto
    {
        [Required]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }
    }
}
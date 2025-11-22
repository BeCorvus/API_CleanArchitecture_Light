using Microsoft.AspNetCore.Mvc;
using FuelManagementSystem.API.DTO;
using FuelManagementSystem.API.Models;
using FuelManagementSystem.API.Repositories;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;

namespace FuelManagementSystem.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RoleController : ControllerBase
    {
        private readonly IRoleRepository _roleRepository;

        public RoleController(IRoleRepository roleRepository)
        {
            _roleRepository = roleRepository;
        }

        // GET: api/role
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoleDto>>> GetAllRoles()
        {
            var roles = await _roleRepository.GetAllActiveAsync();

            var roleDtos = roles.Select(r => new RoleDto
            {
                Id = r.IdRoles,
                NameRole = r.NameRole,
                Note = r.Note
            });

            return Ok(roleDtos);
        }

        // GET: api/role/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<RoleDto>> GetRoleById(int id)
        {
            var role = await _roleRepository.GetActiveByIdAsync(id);

            if (role == null)
            {
                return NotFound();
            }

            var roleDto = new RoleDto
            {
                Id = role.IdRoles,
                NameRole = role.NameRole,
                Note = role.Note
            };

            return Ok(roleDto);
        }

        // GET: api/role/name/{nameRole}
        [HttpGet("name/{nameRole}")]
        public async Task<ActionResult<IEnumerable<RoleDto>>> GetRoleByName(string nameRole)
        {
            var roles = await _roleRepository.GetByNameRoleAsync(nameRole);

            var roleDtos = roles.Select(r => new RoleDto
            {
                Id = r.IdRoles,
                NameRole = r.NameRole,
                Note = r.Note
            });

            return Ok(roleDtos);
        }

        // GET: api/role/admin
        [HttpGet("admin")]
        public async Task<ActionResult<IEnumerable<RoleAdminDto>>> GetAllRolesForAdmin()
        {
            var roles = await _roleRepository.GetAllAsync();

            var roleAdminDtos = roles.Select(r => new RoleAdminDto
            {
                Id = r.IdRoles,
                NameRole = r.NameRole,
                Note = r.Note,
                DateOfRecording = r.DateOfRecording,
                DateOfChange = r.DateOfChange,
                WhoRecorded = r.WhoRecorded,
                WhoChanged = r.WhoChanged,
                WhenDeleted = r.WhenDeleted
            });

            return Ok(roleAdminDtos);
        }

        // POST: api/role
        [HttpPost]
        public async Task<ActionResult<RoleDto>> CreateRole(CreateRoleDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var role = new Role
            {
                NameRole = createDto.NameRole,
                Note = createDto.Note,
                DateOfRecording = DateTime.Now,
                WhoRecorded = "System",
                WhenDeleted = null
            };

            await _roleRepository.AddAsync(role);

            var roleDto = new RoleDto
            {
                Id = role.IdRoles,
                NameRole = role.NameRole,
                Note = role.Note
            };

            return CreatedAtAction(nameof(GetRoleById), new { id = role.IdRoles }, roleDto);
        }

        // PUT: api/role/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRole(int id, UpdateRoleDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var role = await _roleRepository.GetActiveByIdAsync(id);

            if (role == null)
            {
                return NotFound();
            }

            role.NameRole = updateDto.NameRole;
            role.Note = updateDto.Note;
            role.DateOfChange = DateTime.Now;
            role.WhoChanged = "System";

            await _roleRepository.UpdateAsync(role);

            return NoContent();
        }

        // DELETE: api/role/{id} (Soft Delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> SoftDeleteRole(int id)
        {
            var role = await _roleRepository.GetActiveByIdAsync(id);

            if (role == null)
            {
                return NotFound();
            }

            await _roleRepository.SoftDeleteAsync(id);

            return NoContent();
        }

        // PATCH: api/role/restore/{id}
        [HttpPatch("restore/{id}")]
        public async Task<IActionResult> RestoreRole(int id)
        {
            var role = await _roleRepository.GetByIdAsync(id);

            if (role == null)
            {
                return NotFound();
            }

            if (role.WhenDeleted == null)
            {
                return BadRequest("Role is not deleted.");
            }

            await _roleRepository.RestoreAsync(id);

            return NoContent();
        }

        // GET: api/role/admin/{id}
        [HttpGet("admin/{id}")]
        public async Task<ActionResult<RoleAdminDto>> GetRoleByIdForAdmin(int id)
        {
            var role = await _roleRepository.GetByIdAsync(id);

            if (role == null)
            {
                return NotFound();
            }

            var roleAdminDto = new RoleAdminDto
            {
                Id = role.IdRoles,
                NameRole = role.NameRole,
                Note = role.Note,
                DateOfRecording = role.DateOfRecording,
                DateOfChange = role.DateOfChange,
                WhoRecorded = role.WhoRecorded,
                WhoChanged = role.WhoChanged,
                WhenDeleted = role.WhenDeleted
            };

            return Ok(roleAdminDto);
        }
    }
}
using Microsoft.AspNetCore.Mvc;
using FuelManagementSystem.API.DTO;
using FuelManagementSystem.API.Models;
using FuelManagementSystem.API.Repositories;
using System.ComponentModel.DataAnnotations;

namespace FuelManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EquipmentController : ControllerBase
    {
        private readonly IEquipmentRepository _equipmentRepository;

        public EquipmentController(IEquipmentRepository equipmentRepository)
        {
            _equipmentRepository = equipmentRepository;
        }

        // GET: api/equipment
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EquipmentDto>>> GetAllEquipment()
        {
            var equipment = await _equipmentRepository.GetAllActiveAsync();

            var equipmentDtos = equipment.Select(e => new EquipmentDto
            {
                Id = e.IdEquipment,
                Name = e.Name,
                Brand = e.Brand,
                IdGeyser = e.IdGeyser,
                IdRepair = e.IdRepair,
                Note = e.Note
            });

            return Ok(equipmentDtos);
        }

        // GET: api/equipment/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<EquipmentDto>> GetEquipmentById(int id)
        {
            var equipment = await _equipmentRepository.GetActiveByIdAsync(id);

            if (equipment == null)
            {
                return NotFound();
            }

            var equipmentDto = new EquipmentDto
            {
                Id = equipment.IdEquipment,
                Name = equipment.Name,
                Brand = equipment.Brand,
                IdGeyser = equipment.IdGeyser,
                IdRepair = equipment.IdRepair,
                Note = equipment.Note
            };

            return Ok(equipmentDto);
        }

        // GET: api/equipment/geyser/{geyserId}
        [HttpGet("geyser/{geyserId}")]
        public async Task<ActionResult<IEnumerable<EquipmentDto>>> GetEquipmentByGeyserId(int geyserId)
        {
            var equipment = await _equipmentRepository.GetByGeyserIdAsync(geyserId);
            var activeEquipment = equipment.Where(e => e.WhenDeleted == null);

            var equipmentDtos = activeEquipment.Select(e => new EquipmentDto
            {
                Id = e.IdEquipment,
                Name = e.Name,
                Brand = e.Brand,
                IdGeyser = e.IdGeyser,
                IdRepair = e.IdRepair,
                Note = e.Note
            });

            return Ok(equipmentDtos);
        }

        // GET: api/equipment/brand/{brand}
        [HttpGet("brand/{brand}")]
        public async Task<ActionResult<IEnumerable<EquipmentDto>>> GetEquipmentByBrand(string brand)
        {
            var equipment = await _equipmentRepository.GetByBrandAsync(brand);
            var activeEquipment = equipment.Where(e => e.WhenDeleted == null);

            var equipmentDtos = activeEquipment.Select(e => new EquipmentDto
            {
                Id = e.IdEquipment,
                Name = e.Name,
                Brand = e.Brand,
                IdGeyser = e.IdGeyser,
                IdRepair = e.IdRepair,
                Note = e.Note
            });

            return Ok(equipmentDtos);
        }

        // GET: api/equipment/admin
        [HttpGet("admin")]
        public async Task<ActionResult<IEnumerable<EquipmentAdminDto>>> GetAllEquipmentForAdmin()
        {
            var equipment = await _equipmentRepository.GetAllAsync();

            var equipmentAdminDtos = equipment.Select(e => new EquipmentAdminDto
            {
                Id = e.IdEquipment,
                Name = e.Name,
                Brand = e.Brand,
                IdGeyser = e.IdGeyser,
                IdRepair = e.IdRepair,
                Note = e.Note,
                DateOfRecording = e.DateOfRecording,
                DateOfChange = e.DateOfChange,
                WhoRecorded = e.WhoRecorded,
                WhoChanged = e.WhoChanged,
                WhenDeleted = e.WhenDeleted
            });

            return Ok(equipmentAdminDtos);
        }

        // POST: api/equipment
        [HttpPost]
        public async Task<ActionResult<EquipmentDto>> CreateEquipment(CreateEquipmentDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var equipment = new Equipment
            {
                Name = createDto.Name,
                Brand = createDto.Brand,
                IdGeyser = createDto.IdGeyser,
                IdRepair = createDto.IdRepair,
                Note = createDto.Note,
                DateOfRecording = DateTime.Now,
                WhoRecorded = "System",
                WhenDeleted = null
            };

            await _equipmentRepository.AddAsync(equipment);

            var equipmentDto = new EquipmentDto
            {
                Id = equipment.IdEquipment,
                Name = equipment.Name,
                Brand = equipment.Brand,
                IdGeyser = equipment.IdGeyser,
                IdRepair = equipment.IdRepair,
                Note = equipment.Note
            };

            return CreatedAtAction(nameof(GetEquipmentById), new { id = equipment.IdEquipment }, equipmentDto);
        }

        // PUT: api/equipment/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEquipment(int id, UpdateEquipmentDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var equipment = await _equipmentRepository.GetActiveByIdAsync(id);

            if (equipment == null)
            {
                return NotFound();
            }

            equipment.Name = updateDto.Name;
            equipment.Brand = updateDto.Brand;
            equipment.IdGeyser = updateDto.IdGeyser;
            equipment.IdRepair = updateDto.IdRepair;
            equipment.Note = updateDto.Note;
            equipment.DateOfChange = DateTime.Now;
            equipment.WhoChanged = "System";

            await _equipmentRepository.UpdateAsync(equipment);

            return NoContent();
        }

        // DELETE: api/equipment/{id} (Soft Delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> SoftDeleteEquipment(int id)
        {
            var equipment = await _equipmentRepository.GetActiveByIdAsync(id);

            if (equipment == null)
            {
                return NotFound();
            }

            await _equipmentRepository.SoftDeleteAsync(id);

            return NoContent();
        }

        // PATCH: api/equipment/restore/{id}
        [HttpPatch("restore/{id}")]
        public async Task<IActionResult> RestoreEquipment(int id)
        {
            var equipment = await _equipmentRepository.GetByIdAsync(id);

            if (equipment == null)
            {
                return NotFound();
            }

            if (equipment.WhenDeleted == null)
            {
                return BadRequest("Equipment is not deleted.");
            }

            await _equipmentRepository.RestoreAsync(id);

            return NoContent();
        }

        // GET: api/equipment/admin/{id}
        [HttpGet("admin/{id}")]
        public async Task<ActionResult<EquipmentAdminDto>> GetEquipmentByIdForAdmin(int id)
        {
            var equipment = await _equipmentRepository.GetByIdAsync(id);

            if (equipment == null)
            {
                return NotFound();
            }

            var equipmentAdminDto = new EquipmentAdminDto
            {
                Id = equipment.IdEquipment,
                Name = equipment.Name,
                Brand = equipment.Brand,
                IdGeyser = equipment.IdGeyser,
                IdRepair = equipment.IdRepair,
                Note = equipment.Note,
                DateOfRecording = equipment.DateOfRecording,
                DateOfChange = equipment.DateOfChange,
                WhoRecorded = equipment.WhoRecorded,
                WhoChanged = equipment.WhoChanged,
                WhenDeleted = equipment.WhenDeleted
            };

            return Ok(equipmentAdminDto);
        }
    }
}
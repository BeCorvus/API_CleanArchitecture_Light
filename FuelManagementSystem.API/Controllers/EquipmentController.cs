using Microsoft.AspNetCore.Mvc;
using FuelManagementSystem.API.DTO;
using FuelManagementSystem.API.Models;
using FuelManagementSystem.API.Repositories;
using AutoMapper;
using System.ComponentModel.DataAnnotations;

namespace FuelManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EquipmentController : ControllerBase
    {
        private readonly IRepository<Equipment> _equipmentRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<EquipmentController> _logger;

        public EquipmentController(
            IRepository<Equipment> equipmentRepository,
            IMapper mapper,
            ILogger<EquipmentController> logger)
        {
            _equipmentRepository = equipmentRepository;
            _mapper = mapper;
            _logger = logger;
        }

        // GET: api/equipment
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EquipmentDto>>> GetAllEquipment()
        {
            try
            {
                var equipment = await _equipmentRepository.GetAllAsync();

                // Фильтруем неудаленные записи (опционально)
                var activeEquipment = equipment.Where(e => !e.IsDeleted);

                var result = _mapper.Map<IEnumerable<EquipmentDto>>(activeEquipment);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting all equipment");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/equipment/5
        [HttpGet("{id}")]
        public async Task<ActionResult<EquipmentDto>> GetEquipmentById(int id)
        {
            try
            {
                var equipment = await _equipmentRepository.GetByIdAsync(id);

                if (equipment == null || equipment.IsDeleted)
                {
                    return NotFound($"Equipment with ID {id} not found");
                }

                var result = _mapper.Map<EquipmentDto>(equipment);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting equipment with ID {EquipmentId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/equipment/admin/5
        [HttpGet("admin/{id}")]
        public async Task<ActionResult<EquipmentAdminDto>> GetEquipmentByIdForAdmin(int id)
        {
            try
            {
                var equipment = await _equipmentRepository.GetByIdAsync(id);

                if (equipment == null)
                {
                    return NotFound($"Equipment with ID {id} not found");
                }

                var result = _mapper.Map<EquipmentAdminDto>(equipment);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting equipment for admin with ID {EquipmentId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/equipment
        [HttpPost]
        public async Task<ActionResult<EquipmentDto>> CreateEquipment([FromBody] CreateEquipmentDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var equipment = _mapper.Map<Equipment>(createDto);
                await _equipmentRepository.AddAsync(equipment);

                var result = _mapper.Map<EquipmentDto>(equipment);
                return CreatedAtAction(nameof(GetEquipmentById), new { id = equipment.IdEquipment }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating equipment");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/equipment/5
        [HttpPut("{id}")]
        public async Task<ActionResult<EquipmentDto>> UpdateEquipment(int id, [FromBody] UpdateEquipmentDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingEquipment = await _equipmentRepository.GetByIdAsync(id);
                if (existingEquipment == null || existingEquipment.IsDeleted)
                {
                    return NotFound($"Equipment with ID {id} not found");
                }

                _mapper.Map(updateDto, existingEquipment);
                await _equipmentRepository.UpdateAsync(existingEquipment);

                var result = _mapper.Map<EquipmentDto>(existingEquipment);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating equipment with ID {EquipmentId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/equipment/5
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteEquipment(int id)
        {
            try
            {
                var equipment = await _equipmentRepository.GetByIdAsync(id);
                if (equipment == null || equipment.IsDeleted)
                {
                    return NotFound($"Equipment with ID {id} not found");
                }

                await _equipmentRepository.SoftDeleteAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting equipment with ID {EquipmentId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/equipment/search?name={name}&brand={brand}
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<EquipmentDto>>> SearchEquipment(
            [FromQuery] string name = null,
            [FromQuery] string brand = null)
        {
            try
            {
                var equipment = await _equipmentRepository.FindAsync(e =>
                    (string.IsNullOrEmpty(name) || e.Name.Contains(name)) &&
                    (string.IsNullOrEmpty(brand) || e.Brand.Contains(brand)) &&
                    !e.IsDeleted);

                var result = _mapper.Map<IEnumerable<EquipmentDto>>(equipment);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while searching equipment");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/equipment/admin
        [HttpGet("admin")]
        public async Task<ActionResult<IEnumerable<EquipmentAdminDto>>> GetAllEquipmentForAdmin()
        {
            try
            {
                var equipment = await _equipmentRepository.GetAllAsync();
                var result = _mapper.Map<IEnumerable<EquipmentAdminDto>>(equipment);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting all equipment for admin");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
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
    public class RepairController : ControllerBase
    {
        private readonly IRepairRepository _repairRepository;

        public RepairController(IRepairRepository repairRepository)
        {
            _repairRepository = repairRepository;
        }

        // GET: api/repair
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RepairDto>>> GetAllRepairs()
        {
            var repairs = await _repairRepository.GetAllActiveAsync();

            var repairDtos = repairs.Select(r => new RepairDto
            {
                Id = r.IdRepair,
                Name = r.Name,
                DateOfRepair = r.DateOfRepair,
                Manufacturer = r.Manufacturer,
                ReleaseDate = r.ReleaseDate,
                Repairman = r.Repairman,
                Cost = r.Cost,
                Note = r.Note
            });

            return Ok(repairDtos);
        }

        // GET: api/repair/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<RepairDto>> GetRepairById(int id)
        {
            var repair = await _repairRepository.GetActiveByIdAsync(id);

            if (repair == null)
            {
                return NotFound();
            }

            var repairDto = new RepairDto
            {
                Id = repair.IdRepair,
                Name = repair.Name,
                DateOfRepair = repair.DateOfRepair,
                Manufacturer = repair.Manufacturer,
                ReleaseDate = repair.ReleaseDate,
                Repairman = repair.Repairman,
                Cost = repair.Cost,
                Note = repair.Note
            };

            return Ok(repairDto);
        }

        // GET: api/repair/repairman/{repairman}
        [HttpGet("repairman/{repairman}")]
        public async Task<ActionResult<IEnumerable<RepairDto>>> GetRepairByRepairman(string repairman)
        {
            var repairs = await _repairRepository.GetByRepairmanAsync(repairman);

            var repairDtos = repairs.Select(r => new RepairDto
            {
                Id = r.IdRepair,
                Name = r.Name,
                DateOfRepair = r.DateOfRepair,
                Manufacturer = r.Manufacturer,
                ReleaseDate = r.ReleaseDate,
                Repairman = r.Repairman,
                Cost = r.Cost,
                Note = r.Note
            });

            return Ok(repairDtos);
        }

        // GET: api/repair/manufacturer/{manufacturer}
        [HttpGet("manufacturer/{manufacturer}")]
        public async Task<ActionResult<IEnumerable<RepairDto>>> GetRepairByManufacturer(string manufacturer)
        {
            var repairs = await _repairRepository.GetByManufacturerAsync(manufacturer);

            var repairDtos = repairs.Select(r => new RepairDto
            {
                Id = r.IdRepair,
                Name = r.Name,
                DateOfRepair = r.DateOfRepair,
                Manufacturer = r.Manufacturer,
                ReleaseDate = r.ReleaseDate,
                Repairman = r.Repairman,
                Cost = r.Cost,
                Note = r.Note
            });

            return Ok(repairDtos);
        }

        // GET: api/repair/search
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<RepairDto>>> SearchRepair(
            [FromQuery] DateOnly? startDate,
            [FromQuery] DateOnly? endDate,
            [FromQuery] decimal? minCost,
            [FromQuery] decimal? maxCost)
        {
            var repairs = await _repairRepository.GetByDateOfRepairRangeAsync(startDate, endDate);

            // Дополнительная фильтрация по цене, если нужно
            if (minCost.HasValue || maxCost.HasValue)
            {
                repairs = repairs.Where(r =>
                    (!minCost.HasValue || r.Cost >= minCost.Value) &&
                    (!maxCost.HasValue || r.Cost <= maxCost.Value)
                );
            }

            var repairDtos = repairs.Select(r => new RepairDto
            {
                Id = r.IdRepair,
                Name = r.Name,
                DateOfRepair = r.DateOfRepair,
                Manufacturer = r.Manufacturer,
                ReleaseDate = r.ReleaseDate,
                Repairman = r.Repairman,
                Cost = r.Cost,
                Note = r.Note
            });

            return Ok(repairDtos);
        }

        // GET: api/repair/admin
        [HttpGet("admin")]
        public async Task<ActionResult<IEnumerable<RepairAdminDto>>> GetAllRepairsForAdmin()
        {
            var repairs = await _repairRepository.GetAllAsync();

            var repairAdminDtos = repairs.Select(r => new RepairAdminDto
            {
                Id = r.IdRepair,
                Name = r.Name,
                DateOfRepair = r.DateOfRepair,
                Manufacturer = r.Manufacturer,
                ReleaseDate = r.ReleaseDate,
                Repairman = r.Repairman,
                Cost = r.Cost,
                Note = r.Note,
                DateOfRecording = r.DateOfRecording,
                DateOfChange = r.DateOfChange,
                WhoRecorded = r.WhoRecorded,
                WhoChanged = r.WhoChanged,
                WhenDeleted = r.WhenDeleted
            });

            return Ok(repairAdminDtos);
        }

        // POST: api/repair
        [HttpPost]
        public async Task<ActionResult<RepairDto>> CreateRepair(CreateRepairDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var repair = new Repair
            {
                Name = createDto.Name,
                DateOfRepair = createDto.DateOfRepair,
                Manufacturer = createDto.Manufacturer,
                ReleaseDate = createDto.ReleaseDate,
                Repairman = createDto.Repairman,
                Cost = createDto.Cost,
                Note = createDto.Note,
                DateOfRecording = DateTime.Now,
                WhoRecorded = "System",
                WhenDeleted = null
            };

            await _repairRepository.AddAsync(repair);

            var repairDto = new RepairDto
            {
                Id = repair.IdRepair,
                Name = repair.Name,
                DateOfRepair = repair.DateOfRepair,
                Manufacturer = repair.Manufacturer,
                ReleaseDate = repair.ReleaseDate,
                Repairman = repair.Repairman,
                Cost = repair.Cost,
                Note = repair.Note
            };

            return CreatedAtAction(nameof(GetRepairById), new { id = repair.IdRepair }, repairDto);
        }

        // PUT: api/repair/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRepair(int id, UpdateRepairDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var repair = await _repairRepository.GetActiveByIdAsync(id);

            if (repair == null)
            {
                return NotFound();
            }

            repair.Name = updateDto.Name;
            repair.DateOfRepair = updateDto.DateOfRepair;
            repair.Manufacturer = updateDto.Manufacturer;
            repair.ReleaseDate = updateDto.ReleaseDate;
            repair.Repairman = updateDto.Repairman;
            repair.Cost = updateDto.Cost;
            repair.Note = updateDto.Note;
            repair.DateOfChange = DateTime.Now;
            repair.WhoChanged = "System";

            await _repairRepository.UpdateAsync(repair);

            return NoContent();
        }

        // DELETE: api/repair/{id} (Soft Delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> SoftDeleteRepair(int id)
        {
            var repair = await _repairRepository.GetActiveByIdAsync(id);

            if (repair == null)
            {
                return NotFound();
            }

            await _repairRepository.SoftDeleteAsync(id);

            return NoContent();
        }

        // PATCH: api/repair/restore/{id}
        [HttpPatch("restore/{id}")]
        public async Task<IActionResult> RestoreRepair(int id)
        {
            var repair = await _repairRepository.GetByIdAsync(id);

            if (repair == null)
            {
                return NotFound();
            }

            if (repair.WhenDeleted == null)
            {
                return BadRequest("Repair is not deleted.");
            }

            await _repairRepository.RestoreAsync(id);

            return NoContent();
        }

        // GET: api/repair/admin/{id}
        [HttpGet("admin/{id}")]
        public async Task<ActionResult<RepairAdminDto>> GetRepairByIdForAdmin(int id)
        {
            var repair = await _repairRepository.GetByIdAsync(id);

            if (repair == null)
            {
                return NotFound();
            }

            var repairAdminDto = new RepairAdminDto
            {
                Id = repair.IdRepair,
                Name = repair.Name,
                DateOfRepair = repair.DateOfRepair,
                Manufacturer = repair.Manufacturer,
                ReleaseDate = repair.ReleaseDate,
                Repairman = repair.Repairman,
                Cost = repair.Cost,
                Note = repair.Note,
                DateOfRecording = repair.DateOfRecording,
                DateOfChange = repair.DateOfChange,
                WhoRecorded = repair.WhoRecorded,
                WhoChanged = repair.WhoChanged,
                WhenDeleted = repair.WhenDeleted
            };

            return Ok(repairAdminDto);
        }
    }
}
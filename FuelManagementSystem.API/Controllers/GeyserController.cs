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
    public class GeyserController : ControllerBase
    {
        private readonly IGeyserRepository _geyserRepository;

        public GeyserController(IGeyserRepository geyserRepository)
        {
            _geyserRepository = geyserRepository;
        }

        // GET: api/geyser
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GeyserDto>>> GetAllGeysers()
        {
            var geysers = await _geyserRepository.GetAllActiveAsync();

            var geyserDtos = geysers.Select(g => new GeyserDto
            {
                Id = g.IdGeyser,
                Name = g.Name,
                YearOfRelease = g.YearOfRelease,
                IdRepair = g.IdRepair,
                IdFuel = g.IdFuel,
                Manufacturer = g.Manufacturer,
                Note = g.Note
            });

            return Ok(geyserDtos);
        }

        // GET: api/geyser/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<GeyserDto>> GetGeyserById(int id)
        {
            var geyser = await _geyserRepository.GetActiveByIdAsync(id);

            if (geyser == null)
            {
                return NotFound();
            }

            var geyserDto = new GeyserDto
            {
                Id = geyser.IdGeyser,
                Name = geyser.Name,
                YearOfRelease = geyser.YearOfRelease,
                IdRepair = geyser.IdRepair,
                IdFuel = geyser.IdFuel,
                Manufacturer = geyser.Manufacturer,
                Note = geyser.Note
            };

            return Ok(geyserDto);
        }

        // GET: api/geyser/manufacturer/{manufacturer}
        [HttpGet("manufacturer/{manufacturer}")]
        public async Task<ActionResult<IEnumerable<GeyserDto>>> GetGeyserByManufacturer(string manufacturer)
        {
            var geysers = await _geyserRepository.GetByManufacturerAsync(manufacturer);

            var geyserDtos = geysers.Select(g => new GeyserDto
            {
                Id = g.IdGeyser,
                Name = g.Name,
                YearOfRelease = g.YearOfRelease,
                IdRepair = g.IdRepair,
                IdFuel = g.IdFuel,
                Manufacturer = g.Manufacturer,
                Note = g.Note
            });

            return Ok(geyserDtos);
        }

        // GET: api/geyser/fuel/{fuelId}
        [HttpGet("fuel/{fuelId}")]
        public async Task<ActionResult<IEnumerable<GeyserDto>>> GetGeyserByFuelId(int fuelId)
        {
            var geysers = await _geyserRepository.GetByFuelIdAsync(fuelId);

            var geyserDtos = geysers.Select(g => new GeyserDto
            {
                Id = g.IdGeyser,
                Name = g.Name,
                YearOfRelease = g.YearOfRelease,
                IdRepair = g.IdRepair,
                IdFuel = g.IdFuel,
                Manufacturer = g.Manufacturer,
                Note = g.Note
            });

            return Ok(geyserDtos);
        }

        // GET: api/geyser/repair/{repairId}
        [HttpGet("repair/{repairId}")]
        public async Task<ActionResult<IEnumerable<GeyserDto>>> GetGeyserByRepairId(int repairId)
        {
            var geysers = await _geyserRepository.GetByRepairIdAsync(repairId);

            var geyserDtos = geysers.Select(g => new GeyserDto
            {
                Id = g.IdGeyser,
                Name = g.Name,
                YearOfRelease = g.YearOfRelease,
                IdRepair = g.IdRepair,
                IdFuel = g.IdFuel,
                Manufacturer = g.Manufacturer,
                Note = g.Note
            });

            return Ok(geyserDtos);
        }

        // GET: api/geyser/search
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<GeyserDto>>> SearchGeyser(
            [FromQuery] int? startYear,
            [FromQuery] int? endYear)
        {
            var geysers = await _geyserRepository.GetByYearOfReleaseRangeAsync(startYear, endYear);

            var geyserDtos = geysers.Select(g => new GeyserDto
            {
                Id = g.IdGeyser,
                Name = g.Name,
                YearOfRelease = g.YearOfRelease,
                IdRepair = g.IdRepair,
                IdFuel = g.IdFuel,
                Manufacturer = g.Manufacturer,
                Note = g.Note
            });

            return Ok(geyserDtos);
        }

        // GET: api/geyser/admin
        [HttpGet("admin")]
        public async Task<ActionResult<IEnumerable<GeyserAdminDto>>> GetAllGeysersForAdmin()
        {
            var geysers = await _geyserRepository.GetAllAsync();

            var geyserAdminDtos = geysers.Select(g => new GeyserAdminDto
            {
                Id = g.IdGeyser,
                Name = g.Name,
                YearOfRelease = g.YearOfRelease,
                IdRepair = g.IdRepair,
                IdFuel = g.IdFuel,
                Manufacturer = g.Manufacturer,
                Note = g.Note,
                DateOfRecording = g.DateOfRecording,
                DateOfChange = g.DateOfChange,
                WhoRecorded = g.WhoRecorded,
                WhoChanged = g.WhoChanged,
                WhenDeleted = g.WhenDeleted
            });

            return Ok(geyserAdminDtos);
        }

        // POST: api/geyser
        [HttpPost]
        public async Task<ActionResult<GeyserDto>> CreateGeyser(CreateGeyserDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var geyser = new Geyser
            {
                Name = createDto.Name,
                YearOfRelease = createDto.YearOfRelease,
                IdRepair = createDto.IdRepair,
                IdFuel = createDto.IdFuel,
                Manufacturer = createDto.Manufacturer,
                Note = createDto.Note,
                DateOfRecording = DateTime.Now,
                WhoRecorded = "System",
                WhenDeleted = null
            };

            await _geyserRepository.AddAsync(geyser);

            var geyserDto = new GeyserDto
            {
                Id = geyser.IdGeyser,
                Name = geyser.Name,
                YearOfRelease = geyser.YearOfRelease,
                IdRepair = geyser.IdRepair,
                IdFuel = geyser.IdFuel,
                Manufacturer = geyser.Manufacturer,
                Note = geyser.Note
            };

            return CreatedAtAction(nameof(GetGeyserById), new { id = geyser.IdGeyser }, geyserDto);
        }

        // PUT: api/geyser/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateGeyser(int id, UpdateGeyserDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var geyser = await _geyserRepository.GetActiveByIdAsync(id);

            if (geyser == null)
            {
                return NotFound();
            }

            geyser.Name = updateDto.Name;
            geyser.YearOfRelease = updateDto.YearOfRelease;
            geyser.IdRepair = updateDto.IdRepair;
            geyser.IdFuel = updateDto.IdFuel;
            geyser.Manufacturer = updateDto.Manufacturer;
            geyser.Note = updateDto.Note;
            geyser.DateOfChange = DateTime.Now;
            geyser.WhoChanged = "System";

            await _geyserRepository.UpdateAsync(geyser);

            return NoContent();
        }

        // DELETE: api/geyser/{id} (Soft Delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> SoftDeleteGeyser(int id)
        {
            var geyser = await _geyserRepository.GetActiveByIdAsync(id);

            if (geyser == null)
            {
                return NotFound();
            }

            await _geyserRepository.SoftDeleteAsync(id);

            return NoContent();
        }

        // PATCH: api/geyser/restore/{id}
        [HttpPatch("restore/{id}")]
        public async Task<IActionResult> RestoreGeyser(int id)
        {
            var geyser = await _geyserRepository.GetByIdAsync(id);

            if (geyser == null)
            {
                return NotFound();
            }

            if (geyser.WhenDeleted == null)
            {
                return BadRequest("Geyser is not deleted.");
            }

            await _geyserRepository.RestoreAsync(id);

            return NoContent();
        }

        // GET: api/geyser/admin/{id}
        [HttpGet("admin/{id}")]
        public async Task<ActionResult<GeyserAdminDto>> GetGeyserByIdForAdmin(int id)
        {
            var geyser = await _geyserRepository.GetByIdAsync(id);

            if (geyser == null)
            {
                return NotFound();
            }

            var geyserAdminDto = new GeyserAdminDto
            {
                Id = geyser.IdGeyser,
                Name = geyser.Name,
                YearOfRelease = geyser.YearOfRelease,
                IdRepair = geyser.IdRepair,
                IdFuel = geyser.IdFuel,
                Manufacturer = geyser.Manufacturer,
                Note = geyser.Note,
                DateOfRecording = geyser.DateOfRecording,
                DateOfChange = geyser.DateOfChange,
                WhoRecorded = geyser.WhoRecorded,
                WhoChanged = geyser.WhoChanged,
                WhenDeleted = geyser.WhenDeleted
            };

            return Ok(geyserAdminDto);
        }
    }
}
using Microsoft.AspNetCore.Mvc;
using FuelManagementSystem.API.DTO;
using FuelManagementSystem.API.Models;
using FuelManagementSystem.API.Repositories;
using System.ComponentModel.DataAnnotations;

namespace FuelManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FuelController : ControllerBase
    {
        private readonly IFuelRepository _fuelRepository;

        public FuelController(IFuelRepository fuelRepository)
        {
            _fuelRepository = fuelRepository;
        }

        // GET: api/fuel
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FuelDto>>> GetAllFuel()
        {
            var fuels = await _fuelRepository.GetAllActiveAsync();

            var fuelDtos = fuels.Select(f => new FuelDto
            {
                Id = f.IdFuel,
                Brand = f.Brand,
                ShelfLife = f.ShelfLife,
                Manufacturer = f.Manufacturer,
                Cost = f.Cost,
                Note = f.Note
            });

            return Ok(fuelDtos);
        }

        // GET: api/fuel/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<FuelDto>> GetFuelById(int id)
        {
            var fuel = await _fuelRepository.GetActiveByIdAsync(id);

            if (fuel == null)
            {
                return NotFound();
            }

            var fuelDto = new FuelDto
            {
                Id = fuel.IdFuel,
                Brand = fuel.Brand,
                ShelfLife = fuel.ShelfLife,
                Manufacturer = fuel.Manufacturer,
                Cost = fuel.Cost,
                Note = fuel.Note
            };

            return Ok(fuelDto);
        }

        // GET: api/fuel/brand/{brand}
        [HttpGet("brand/{brand}")]
        public async Task<ActionResult<IEnumerable<FuelDto>>> GetFuelByBrand(string brand)
        {
            var fuels = await _fuelRepository.GetByBrandAsync(brand);

            var fuelDtos = fuels.Select(f => new FuelDto
            {
                Id = f.IdFuel,
                Brand = f.Brand,
                ShelfLife = f.ShelfLife,
                Manufacturer = f.Manufacturer,
                Cost = f.Cost,
                Note = f.Note
            });

            return Ok(fuelDtos);
        }

        // GET: api/fuel/manufacturer/{manufacturer}
        [HttpGet("manufacturer/{manufacturer}")]
        public async Task<ActionResult<IEnumerable<FuelDto>>> GetFuelByManufacturer(string manufacturer)
        {
            var fuels = await _fuelRepository.GetByManufacturerAsync(manufacturer);

            var fuelDtos = fuels.Select(f => new FuelDto
            {
                Id = f.IdFuel,
                Brand = f.Brand,
                ShelfLife = f.ShelfLife,
                Manufacturer = f.Manufacturer,
                Cost = f.Cost,
                Note = f.Note
            });

            return Ok(fuelDtos);
        }

        // GET: api/fuel/search
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<FuelDto>>> SearchFuel(
            [FromQuery] int? minShelfLife,
            [FromQuery] int? maxShelfLife,
            [FromQuery] decimal? minCost,
            [FromQuery] decimal? maxCost)
        {
            var fuels = await _fuelRepository.GetByShelfLifeRangeAsync(minShelfLife, maxShelfLife);

            // Дополнительная фильтрация по цене, если нужно
            if (minCost.HasValue || maxCost.HasValue)
            {
                fuels = fuels.Where(f =>
                    (!minCost.HasValue || f.Cost >= minCost.Value) &&
                    (!maxCost.HasValue || f.Cost <= maxCost.Value)
                );
            }

            var fuelDtos = fuels.Select(f => new FuelDto
            {
                Id = f.IdFuel,
                Brand = f.Brand,
                ShelfLife = f.ShelfLife,
                Manufacturer = f.Manufacturer,
                Cost = f.Cost,
                Note = f.Note
            });

            return Ok(fuelDtos);
        }

        // GET: api/fuel/admin
        [HttpGet("admin")]
        public async Task<ActionResult<IEnumerable<FuelAdminDto>>> GetAllFuelForAdmin()
        {
            var fuels = await _fuelRepository.GetAllAsync();

            var fuelAdminDtos = fuels.Select(f => new FuelAdminDto
            {
                Id = f.IdFuel,
                Brand = f.Brand,
                ShelfLife = f.ShelfLife,
                Manufacturer = f.Manufacturer,
                Cost = f.Cost,
                Note = f.Note,
                DateOfRecording = f.DateOfRecording,
                DateOfChange = f.DateOfChange,
                WhoRecorded = f.WhoRecorded,
                WhoChanged = f.WhoChanged,
                WhenDeleted = f.WhenDeleted
            });

            return Ok(fuelAdminDtos);
        }

        // POST: api/fuel
        [HttpPost]
        public async Task<ActionResult<FuelDto>> CreateFuel(CreateFuelDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var fuel = new Fuel
            {
                Brand = createDto.Brand,
                ShelfLife = createDto.ShelfLife,
                Manufacturer = createDto.Manufacturer,
                Cost = createDto.Cost,
                Note = createDto.Note,
                DateOfRecording = DateTime.Now,
                WhoRecorded = "System",
                WhenDeleted = null
            };

            await _fuelRepository.AddAsync(fuel);

            var fuelDto = new FuelDto
            {
                Id = fuel.IdFuel,
                Brand = fuel.Brand,
                ShelfLife = fuel.ShelfLife,
                Manufacturer = fuel.Manufacturer,
                Cost = fuel.Cost,
                Note = fuel.Note
            };

            return CreatedAtAction(nameof(GetFuelById), new { id = fuel.IdFuel }, fuelDto);
        }

        // PUT: api/fuel/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFuel(int id, UpdateFuelDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var fuel = await _fuelRepository.GetActiveByIdAsync(id);

            if (fuel == null)
            {
                return NotFound();
            }

            fuel.Brand = updateDto.Brand;
            fuel.ShelfLife = updateDto.ShelfLife;
            fuel.Manufacturer = updateDto.Manufacturer;
            fuel.Cost = updateDto.Cost;
            fuel.Note = updateDto.Note;
            fuel.DateOfChange = DateTime.Now;
            fuel.WhoChanged = "System";

            await _fuelRepository.UpdateAsync(fuel);

            return NoContent();
        }

        // DELETE: api/fuel/{id} (Soft Delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> SoftDeleteFuel(int id)
        {
            var fuel = await _fuelRepository.GetActiveByIdAsync(id);

            if (fuel == null)
            {
                return NotFound();
            }

            await _fuelRepository.SoftDeleteAsync(id);

            return NoContent();
        }

        // PATCH: api/fuel/restore/{id}
        [HttpPatch("restore/{id}")]
        public async Task<IActionResult> RestoreFuel(int id)
        {
            var fuel = await _fuelRepository.GetByIdAsync(id);

            if (fuel == null)
            {
                return NotFound();
            }

            if (fuel.WhenDeleted == null)
            {
                return BadRequest("Fuel is not deleted.");
            }

            await _fuelRepository.RestoreAsync(id);

            return NoContent();
        }

        // GET: api/fuel/admin/{id}
        [HttpGet("admin/{id}")]
        public async Task<ActionResult<FuelAdminDto>> GetFuelByIdForAdmin(int id)
        {
            var fuel = await _fuelRepository.GetByIdAsync(id);

            if (fuel == null)
            {
                return NotFound();
            }

            var fuelAdminDto = new FuelAdminDto
            {
                Id = fuel.IdFuel,
                Brand = fuel.Brand,
                ShelfLife = fuel.ShelfLife,
                Manufacturer = fuel.Manufacturer,
                Cost = fuel.Cost,
                Note = fuel.Note,
                DateOfRecording = fuel.DateOfRecording,
                DateOfChange = fuel.DateOfChange,
                WhoRecorded = fuel.WhoRecorded,
                WhoChanged = fuel.WhoChanged,
                WhenDeleted = fuel.WhenDeleted
            };

            return Ok(fuelAdminDto);
        }
    }
}
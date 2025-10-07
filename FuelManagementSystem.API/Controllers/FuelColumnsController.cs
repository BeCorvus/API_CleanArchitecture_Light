using FuelManagementSystem.Models;
using FuelManagementSystem.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace FuelManagementSystem.API.Controllers
{
    public class FuelColumnsController : BaseApiController<FuelColumn>
    {
        private readonly IFuelColumnRepository _fuelColumnRepository;

        public FuelColumnsController(IFuelColumnRepository repository) : base(repository)
        {
            _fuelColumnRepository = repository;
        }

        [HttpGet("with-nozzles")]
        public async Task<ActionResult<IEnumerable<FuelColumn>>> GetFuelColumnsWithNozzles()
        {
            var fuelColumns = await _fuelColumnRepository.GetFuelColumnsWithNozzlesAsync();
            return Ok(fuelColumns);
        }

        protected override int GetEntityId(FuelColumn entity)
        {
            return entity.ID_Column;
        }
    }
}
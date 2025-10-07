using FuelManagementSystem.Models;
using FuelManagementSystem.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace FuelManagementSystem.API.Controllers
{
    public class NozzlesController : BaseApiController<Nozzle>
    {
        public NozzlesController(IRepository<Nozzle> repository) : base(repository)
        {
        }

        protected override int GetEntityId(Nozzle entity)
        {
            return entity.ID_Nozzle;
        }
    }
}
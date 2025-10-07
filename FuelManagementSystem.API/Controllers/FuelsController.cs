using FuelManagementSystem.Models;
using FuelManagementSystem.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace FuelManagementSystem.API.Controllers
{
    public class FuelsController : BaseApiController<Fuel>
    {
        public FuelsController(IRepository<Fuel> repository) : base(repository)
        {
        }

        protected override int GetEntityId(Fuel entity)
        {
            return entity.ID_Fuel;
        }
    }
}
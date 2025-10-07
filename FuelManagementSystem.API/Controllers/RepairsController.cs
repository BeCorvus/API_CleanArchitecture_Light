using FuelManagementSystem.Models;
using FuelManagementSystem.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace FuelManagementSystem.API.Controllers
{
    public class RepairsController : BaseApiController<Repair>
    {
        public RepairsController(IRepository<Repair> repository) : base(repository)
        {
        }

        protected override int GetEntityId(Repair entity)
        {
            return entity.ID_Repair;
        }
    }
}
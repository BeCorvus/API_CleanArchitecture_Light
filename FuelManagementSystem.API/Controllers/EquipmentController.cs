using FuelManagementSystem.Models;
using FuelManagementSystem.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace FuelManagementSystem.API.Controllers
{
    public class EquipmentController : BaseApiController<Equipment>
    {
        public EquipmentController(IRepository<Equipment> repository) : base(repository)
        {
        }

        protected override int GetEntityId(Equipment entity)
        {
            return entity.ID_Equipment;
        }
    }
}
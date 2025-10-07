using FuelManagementSystem.Models;
using FuelManagementSystem.API.Repositories;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FuelManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public abstract class BaseApiController<T> : ControllerBase where T : class
    {
        protected readonly IRepository<T> _repository;

        public BaseApiController(IRepository<T> repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public virtual async Task<ActionResult<IEnumerable<T>>> GetAll()
        {
            var entities = await _repository.GetAllAsync();
            return Ok(entities);
        }

        [HttpGet("{id}")]
        public virtual async Task<ActionResult<T>> GetById(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null)
                return NotFound();

            return Ok(entity);
        }

        [HttpPost]
        public virtual async Task<ActionResult<T>> Create(T entity)
        {
            await _repository.AddAsync(entity);
            return CreatedAtAction(nameof(GetById), new { id = GetEntityId(entity) }, entity);
        }

        [HttpPut("{id}")]
        public virtual async Task<IActionResult> Update(int id, T entity)
        {
            if (id != GetEntityId(entity))
                return BadRequest();

            await _repository.UpdateAsync(entity);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public virtual async Task<IActionResult> Delete(int id)
        {
            await _repository.SoftDeleteAsync(id);
            return NoContent();
        }

        protected abstract int GetEntityId(T entity);
    }
}
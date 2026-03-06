using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Common.Models;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PrioritiesController : ControllerBase
{
    private readonly ICatalogRepository _catalogRepository;

    public PrioritiesController(ICatalogRepository catalogRepository)
    {
        _catalogRepository = catalogRepository;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetPriorities()
    {
        try
        {
            var priorities = await _catalogRepository.GetPrioritiesAsync();
            return Ok(ApiResponse<object>.SuccessResult(priorities, "Prioridades obtenidas exitosamente"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResult("Error interno del servidor", 500));
        }
    }
}

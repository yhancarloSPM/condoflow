using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Common.Models;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventTypesController : ControllerBase
{
    private readonly ICatalogRepository _catalogRepository;

    public EventTypesController(ICatalogRepository catalogRepository)
    {
        _catalogRepository = catalogRepository;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetEventTypes()
    {
        try
        {
            var eventTypes = await _catalogRepository.GetEventTypesAsync();
            return Ok(ApiResponse<object>.SuccessResult(eventTypes, "Tipos de evento obtenidos exitosamente"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResult("Error interno del servidor", 500));
        }
    }
}

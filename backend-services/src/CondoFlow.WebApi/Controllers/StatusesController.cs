using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Common.Models;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatusesController : ControllerBase
{
    private readonly ICatalogRepository _catalogRepository;

    public StatusesController(ICatalogRepository catalogRepository)
    {
        _catalogRepository = catalogRepository;
    }

    [HttpGet("reservation")]
    public async Task<ActionResult<ApiResponse<object>>> GetReservationStatuses()
    {
        try
        {
            var statuses = await _catalogRepository.GetReservationStatusesAsync();
            return Ok(ApiResponse<object>.SuccessResult(statuses, "Estados de reserva obtenidos exitosamente"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResult("Error interno del servidor", 500));
        }
    }

    [HttpGet("incident")]
    public async Task<ActionResult<ApiResponse<object>>> GetIncidentStatuses()
    {
        try
        {
            var statuses = await _catalogRepository.GetIncidentStatusesAsync();
            return Ok(ApiResponse<object>.SuccessResult(statuses, "Estados de incidencia obtenidos exitosamente"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResult("Error interno del servidor", 500));
        }
    }

    [HttpGet("expense")]
    public async Task<ActionResult<ApiResponse<object>>> GetExpenseStatuses()
    {
        try
        {
            var statuses = await _catalogRepository.GetExpenseStatusesAsync();
            return Ok(ApiResponse<object>.SuccessResult(statuses, "Estados de gasto obtenidos exitosamente"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResult("Error interno del servidor", 500));
        }
    }
}

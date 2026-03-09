using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Interfaces.Repositories;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatusesController : BaseApiController
{
    private readonly ICatalogRepository _catalogRepository;

    public StatusesController(ICatalogRepository catalogRepository)
    {
        _catalogRepository = catalogRepository;
    }

    [HttpGet("reservation")]
    public async Task<IActionResult> GetReservationStatuses()
    {
        var statuses = await _catalogRepository.GetReservationStatusesAsync();
        return Success(statuses, "Estados de reserva obtenidos exitosamente");
    }

    [HttpGet("incident")]
    public async Task<IActionResult> GetIncidentStatuses()
    {
        var statuses = await _catalogRepository.GetIncidentStatusesAsync();
        return Success(statuses, "Estados de incidencia obtenidos exitosamente");
    }

    [HttpGet("expense")]
    public async Task<IActionResult> GetExpenseStatuses()
    {
        var statuses = await _catalogRepository.GetExpenseStatusesAsync();
        return Success(statuses, "Estados de gasto obtenidos exitosamente");
    }
}

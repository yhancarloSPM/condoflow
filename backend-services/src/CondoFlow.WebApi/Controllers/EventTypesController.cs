using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Interfaces.Repositories;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventTypesController : BaseApiController
{
    private readonly ICatalogRepository _catalogRepository;

    public EventTypesController(ICatalogRepository catalogRepository)
    {
        _catalogRepository = catalogRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetEventTypes()
    {
        var eventTypes = await _catalogRepository.GetEventTypesAsync();
        return Success(eventTypes, "Tipos de evento obtenidos exitosamente");
    }
}

using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Interfaces.Repositories;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PrioritiesController : BaseApiController
{
    private readonly ICatalogRepository _catalogRepository;

    public PrioritiesController(ICatalogRepository catalogRepository)
    {
        _catalogRepository = catalogRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetPriorities()
    {
        var priorities = await _catalogRepository.GetPrioritiesAsync();
        return Success(priorities, "Prioridades obtenidas exitosamente");
    }
}

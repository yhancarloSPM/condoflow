using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Interfaces.Repositories;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : BaseApiController
{
    private readonly ICatalogRepository _catalogRepository;

    public CategoriesController(ICatalogRepository catalogRepository)
    {
        _catalogRepository = catalogRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _catalogRepository.GetCategoriesAsync();
        return Success(categories, "Categorías obtenidas exitosamente");
    }
}

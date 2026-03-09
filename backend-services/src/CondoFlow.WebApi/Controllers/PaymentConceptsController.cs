using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Interfaces.Repositories;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/payment-concepts")]
public class PaymentConceptsController : BaseApiController
{
    private readonly ICatalogRepository _catalogRepository;

    public PaymentConceptsController(ICatalogRepository catalogRepository)
    {
        _catalogRepository = catalogRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaymentConcepts()
    {
        var concepts = await _catalogRepository.GetPaymentConceptsAsync();
        return Success(concepts, "Conceptos de pago obtenidos exitosamente");
    }
}

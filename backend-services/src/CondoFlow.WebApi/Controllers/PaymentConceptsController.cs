using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Common.Models;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/payment-concepts")]
public class PaymentConceptsController : ControllerBase
{
    private readonly ICatalogRepository _catalogRepository;

    public PaymentConceptsController(ICatalogRepository catalogRepository)
    {
        _catalogRepository = catalogRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaymentConcepts()
    {
        try
        {
            var concepts = await _catalogRepository.GetPaymentConceptsAsync();
            return Ok(ApiResponse<object>.SuccessResult(concepts, "Conceptos de pago obtenidos exitosamente", 200));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResult("Error interno del servidor", 500));
        }
    }
}

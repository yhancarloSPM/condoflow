using Microsoft.AspNetCore.Mvc;
using CondoFlow.Infrastructure.Data;
using CondoFlow.Application.Common.Models;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/payment-concepts")]
public class PaymentConceptsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PaymentConceptsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaymentConcepts()
    {
        var concepts = await _context.PaymentConcepts
            .Where(c => c.IsActive)
            .Select(c => new
            {
                value = c.Code,
                label = c.Name,
                amount = c.DefaultAmount,
                roofAmount = c.RoofAmount,
                autoAmount = c.IsAutoCalculated
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.SuccessResult(concepts, "Conceptos de pago obtenidos exitosamente", 200));
    }
}

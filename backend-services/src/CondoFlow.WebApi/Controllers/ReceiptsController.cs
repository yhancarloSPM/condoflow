using CondoFlow.Application.Interfaces.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/receipts")]
[Authorize]
public class ReceiptsController : BaseApiController
{
    private readonly IPaymentRepository _paymentRepository;

    public ReceiptsController(IPaymentRepository paymentRepository)
    {
        _paymentRepository = paymentRepository;
    }

    [HttpGet("{paymentId}")]
    public async Task<IActionResult> GetReceipt(Guid paymentId)
    {
        var payment = await _paymentRepository.GetByIdAsync(paymentId);
        if (payment == null || string.IsNullOrEmpty(payment.ReceiptData))
            return NotFoundError("Recibo no encontrado");

        // El receiptData ya está en formato data:image/jpeg;base64,xxx
        if (payment.ReceiptData.StartsWith("data:"))
        {
            var base64Data = payment.ReceiptData.Split(',')[1];
            var mimeType = payment.ReceiptData.Split(';')[0].Split(':')[1];
            var fileBytes = Convert.FromBase64String(base64Data);
            
            return File(fileBytes, mimeType);
        }

        return NotFoundError("Recibo no encontrado");
    }
}

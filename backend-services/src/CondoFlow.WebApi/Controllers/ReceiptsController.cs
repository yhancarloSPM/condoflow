using CondoFlow.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/receipts")]
[Authorize]
public class ReceiptsController : ControllerBase
{
    private readonly IPaymentRepository _paymentRepository;

    public ReceiptsController(IPaymentRepository paymentRepository)
    {
        _paymentRepository = paymentRepository;
    }

    [HttpGet("{paymentId}")]
    public async Task<IActionResult> GetReceipt(Guid paymentId)
    {
        try
        {
            var payment = await _paymentRepository.GetByIdAsync(paymentId);
            if (payment == null)
                return NotFound();

            // Si el receiptUrl contiene base64, extraerlo
            if (payment.ReceiptUrl?.StartsWith("data:") == true)
            {
                var base64Data = payment.ReceiptUrl.Split(',')[1];
                var mimeType = payment.ReceiptUrl.Split(';')[0].Split(':')[1];
                var fileBytes = Convert.FromBase64String(base64Data);
                
                return File(fileBytes, mimeType);
            }
            
            // Si es una ruta de archivo físico
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", payment.ReceiptUrl.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
            {
                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                var contentType = GetContentType(filePath);
                return File(fileBytes, contentType);
            }

            return NotFound();
        }
        catch (Exception)
        {
            return StatusCode(500);
        }
    }

    private string GetContentType(string filePath)
    {
        var extension = Path.GetExtension(filePath).ToLowerInvariant();
        return extension switch
        {
            ".pdf" => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            _ => "application/octet-stream"
        };
    }
}

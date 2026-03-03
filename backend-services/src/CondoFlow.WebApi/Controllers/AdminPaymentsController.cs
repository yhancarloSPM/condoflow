using CondoFlow.Application.Common.Models;
using CondoFlow.Application.Common.Services;
using CondoFlow.Infrastructure.Data;
using CondoFlow.Infrastructure.Identity;
using CondoFlow.Infrastructure.Repositories;
using CondoFlow.WebApi.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/admin/payments")]
[Authorize(Roles = "Admin")]
public class AdminPaymentsController : ControllerBase
{
    private readonly ILocalizationService _localization;
    private readonly IPaymentRepository _paymentRepository;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly INotificationService _notificationService;
    private readonly ApplicationDbContext _context;

    public AdminPaymentsController(
        ILocalizationService localization,
        IPaymentRepository paymentRepository,
        UserManager<ApplicationUser> userManager,
        INotificationService notificationService,
        ApplicationDbContext context)
    {
        _localization = localization;
        _paymentRepository = paymentRepository;
        _userManager = userManager;
        _notificationService = notificationService;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllPayments()
    {
        try
        {
            var payments = await _paymentRepository.GetAllAsync();
            var paymentResponses = new List<object>();

            foreach (var payment in payments)
            {
                var user = await _userManager.Users
                    .Include(u => u.ApartmentEntity)
                        .ThenInclude(a => a.Block)
                    .FirstOrDefaultAsync(u => u.OwnerId == payment.OwnerId);
                    
                var ownerInfo = "Usuario no encontrado";
                if (user?.ApartmentEntity != null)
                {
                    ownerInfo = $"{user.FirstName} {user.LastName} | {user.ApartmentEntity.Block.Name}-{user.ApartmentEntity.Number}";
                }
                var ownerName = ownerInfo;

                // Obtener concepto de la deuda si es un pago de deuda
                string concept = payment.Concept;
                if (payment.Concept == "debt_payment" && payment.DebtId.HasValue)
                {
                    var debtRepository = HttpContext.RequestServices.GetRequiredService<IDebtRepository>();
                    var debt = await debtRepository.GetByIdAsync(payment.DebtId.Value);
                    if (debt != null)
                    {
                        concept = debt.Concept;
                    }
                }

                // Obtener información del período de la deuda si existe
                int? debtMonth = null;
                int? debtYear = null;
                if (payment.DebtId.HasValue)
                {
                    var debtRepository = HttpContext.RequestServices.GetRequiredService<IDebtRepository>();
                    var debt = await debtRepository.GetByIdAsync(payment.DebtId.Value);
                    if (debt != null)
                    {
                        debtMonth = debt.Month;
                        debtYear = debt.Year;
                    }
                }

                paymentResponses.Add(new
                {
                    Id = payment.Id,
                    OwnerId = payment.OwnerId,
                    OwnerName = ownerName,
                    DebtId = payment.DebtId,
                    Amount = payment.Amount.Amount,
                    Currency = payment.Amount.Currency,
                    PaymentDate = payment.PaymentDate,
                    PaymentMethod = payment.PaymentMethod,
                    ReceiptUrl = payment.ReceiptUrl,
                    Status = payment.Status.ToString().ToLower(),
                    RejectionReason = payment.RejectionReason,
                    CreatedAt = payment.CreatedAt,
                    Concept = concept,
                    DebtMonth = debtMonth,
                    DebtYear = debtYear
                });
            }

            return Ok(ApiResponse<List<object>>.SuccessResult(paymentResponses, "Pagos obtenidos exitosamente", 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al obtener los pagos", 500));
        }
    }

    [HttpPut("{paymentId}/approve")]
    public async Task<IActionResult> ApprovePayment(Guid paymentId)
    {
        try
        {
            var payment = await _paymentRepository.GetByIdAsync(paymentId);
            if (payment == null)
                return NotFound(ApiResponse.ErrorResult("Pago no encontrado", 404));

            payment.Approve();
            
            // Si es un abono a deuda, aplicar el pago a la deuda
            if (payment.Concept == "debt_payment" && payment.DebtId.HasValue)
            {
                var debtRepository = HttpContext.RequestServices.GetRequiredService<IDebtRepository>();
                var debt = await debtRepository.GetByIdAsync(payment.DebtId.Value);
                if (debt != null)
                {
                    debt.AddPayment(payment.Amount);
                    await debtRepository.UpdateAsync(debt);
                }
            }
            
            await _paymentRepository.UpdateAsync(payment);

            // Enviar notificación al propietario
            try
            {
                var user = await _userManager.Users.FirstOrDefaultAsync(u => u.OwnerId == payment.OwnerId);
                if (user != null)
                {
                    await _notificationService.SendPaymentStatusNotificationAsync(
                        user.Id, payment.Id, "Approved", $"{user.FirstName} {user.LastName}", payment.Amount.Amount);
                }
            }
            catch (Exception ex)
            {

            }

            return Ok(ApiResponse<object>.SuccessResult(new { paymentId }, "Pago aprobado exitosamente", 200));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult($"Error al aprobar el pago | {ex.Message}", 500));
        }
    }

    [HttpPut("{paymentId}/reject")]
    public async Task<IActionResult> RejectPayment(Guid paymentId, [FromBody] RejectPaymentRequest request)
    {
        try
        {
            var payment = await _paymentRepository.GetByIdAsync(paymentId);
            if (payment == null)
                return NotFound(ApiResponse.ErrorResult("Pago no encontrado", 404));

            payment.Reject(request?.Reason);
            
            // Si el pago está asociado a una deuda, revertir su estado
            if (payment.DebtId.HasValue)
            {
                var debtRepository = HttpContext.RequestServices.GetRequiredService<IDebtRepository>();
                var debt = await debtRepository.GetByIdAsync(payment.DebtId.Value);
                if (debt != null)
                {
                    debt.RejectPayment();
                    await debtRepository.UpdateAsync(debt);
                }
            }
            
            await _paymentRepository.UpdateAsync(payment);

            // Enviar notificación al propietario
            try
            {
                var user = await _userManager.Users.FirstOrDefaultAsync(u => u.OwnerId == payment.OwnerId);
                if (user != null)
                {
                    await _notificationService.SendPaymentStatusNotificationAsync(
                        user.Id, payment.Id, "Rejected", $"{user.FirstName} {user.LastName}", payment.Amount.Amount, request?.Reason);
                }
            }
            catch (Exception ex)
            {

            }

            return Ok(ApiResponse<object>.SuccessResult(new { paymentId }, "Pago rechazado exitosamente", 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al rechazar el pago", 500));
        }
    }
}

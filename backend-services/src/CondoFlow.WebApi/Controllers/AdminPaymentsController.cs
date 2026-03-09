using CondoFlow.Application.Common.Models;
using CondoFlow.Application.Common.Services;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Domain.Enums;
using CondoFlow.Infrastructure.Identity;
using CondoFlow.WebApi.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/admin/payments")]
[Authorize(Roles = UserRoles.Admin)]
public class AdminPaymentsController : BaseApiController
{
    private readonly ILocalizationService _localization;
    private readonly IPaymentRepository _paymentRepository;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly INotificationService _notificationService;
    private readonly IDebtRepository _debtRepository;

    public AdminPaymentsController(
        ILocalizationService localization,
        IPaymentRepository paymentRepository,
        UserManager<ApplicationUser> userManager,
        INotificationService notificationService,
        IDebtRepository debtRepository)
    {
        _localization = localization;
        _paymentRepository = paymentRepository;
        _userManager = userManager;
        _notificationService = notificationService;
        _debtRepository = debtRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllPayments()
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
            if (payment.Concept == PaymentConceptCodes.DebtPayment && payment.DebtId.HasValue)
            {
                var debt = await _debtRepository.GetByIdAsync(payment.DebtId.Value);
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
                var debt = await _debtRepository.GetByIdAsync(payment.DebtId.Value);
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
                ReceiptUrl = payment.ReceiptData,
                Status = payment.Status.ToString().ToLower(),
                RejectionReason = payment.RejectionReason,
                CreatedAt = payment.CreatedAt,
                Concept = concept,
                DebtMonth = debtMonth,
                DebtYear = debtYear
            });
        }

        return Success(paymentResponses, "Pagos obtenidos exitosamente");
    }

    [HttpPut("{paymentId}/approve")]
    public async Task<IActionResult> ApprovePayment(Guid paymentId)
    {
        var payment = await _paymentRepository.GetByIdAsync(paymentId);
        if (payment == null)
            return NotFoundError("Pago no encontrado");

        payment.Approve();
        
        // Si es un abono a deuda, aplicar el pago a la deuda
        if (payment.Concept == PaymentConceptCodes.DebtPayment && payment.DebtId.HasValue)
        {
            var debt = await _debtRepository.GetByIdAsync(payment.DebtId.Value);
            if (debt != null)
            {
                debt.AddPayment(payment.Amount);
                await _debtRepository.UpdateAsync(debt);
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
                    user.Id, payment.Id, UserStatusCodes.Approved, $"{user.FirstName} {user.LastName}", payment.Amount.Amount);
            }
        }
        catch (Exception ex)
        {
            // Log error but continue - notification failure shouldn't break the operation
        }

        return Success(new { paymentId }, "Pago aprobado exitosamente");
    }

    [HttpPut("{paymentId}/reject")]
    public async Task<IActionResult> RejectPayment(Guid paymentId, [FromBody] RejectPaymentRequest request)
    {
        var payment = await _paymentRepository.GetByIdAsync(paymentId);
        if (payment == null)
            return NotFoundError("Pago no encontrado");

        payment.Reject(request?.Reason);
        
        // Si el pago está asociado a una deuda, revertir su estado
        if (payment.DebtId.HasValue)
        {
            var debt = await _debtRepository.GetByIdAsync(payment.DebtId.Value);
            if (debt != null)
            {
                debt.RejectPayment();
                await _debtRepository.UpdateAsync(debt);
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
                    user.Id, payment.Id, UserStatusCodes.Rejected, $"{user.FirstName} {user.LastName}", payment.Amount.Amount, request?.Reason);
            }
        }
        catch (Exception ex)
        {
            // Log error but continue - notification failure shouldn't break the operation
        }

        return Success(new { paymentId }, "Pago rechazado exitosamente");
    }
}

using CondoFlow.Application.Common.Models;
using CondoFlow.Application.Common.Services;
using CondoFlow.Application.Common.DTOs.Payment;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Domain.Enums;
using CondoFlow.WebApi.Attributes;
using CondoFlow.WebApi.DTOs;
using CondoFlow.WebApi.Services;
using CondoFlow.Domain.Entities;
using CondoFlow.Domain.ValueObjects;
using CondoFlow.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/owners/{ownerId}/payments")]
[Authorize]
[OwnerAuthorize]
public class PaymentsController : BaseApiController
{
    private readonly ILocalizationService _localization;
    private readonly IFileService _fileService;
    private readonly IPaymentRepository _paymentRepository;
    private readonly IDebtRepository _debtRepository;
    private readonly INotificationService _notificationService;
    private readonly UserManager<ApplicationUser> _userManager;

    public PaymentsController(
        ILocalizationService localization, 
        IFileService fileService, 
        IPaymentRepository paymentRepository, 
        IDebtRepository debtRepository,
        INotificationService notificationService,
        UserManager<ApplicationUser> userManager)
    {
        _localization = localization;
        _fileService = fileService;
        _paymentRepository = paymentRepository;
        _debtRepository = debtRepository;
        _notificationService = notificationService;
        _userManager = userManager;
    }

    [HttpPost]
    public async Task<IActionResult> CreatePayment(Guid ownerId, [FromForm] CreatePaymentRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequestError(_localization.GetMessage("InvalidInputData"));

        if (request.Receipt != null && !_fileService.IsValidReceiptFile(request.Receipt))
            return BadRequestError(_localization.GetMessage("InvalidReceiptFile"));

        // Validar concepto
        var validConcepts = new[] { PaymentConceptCodes.Maintenance, PaymentConceptCodes.Advance, PaymentConceptCodes.DebtPayment };
        if (!validConcepts.Contains(request.Concept))
            return BadRequestError("Concepto de pago no válido");

        Guid? debtId = null;
        
        // Si es pago de mantenimiento, buscar la deuda más antigua pendiente
        if (request.Concept == PaymentConceptCodes.Maintenance)
        {
            var pendingDebts = await _debtRepository.GetPendingDebtsByOwnerIdAsync(ownerId);
            var oldestDebt = pendingDebts.OrderBy(d => d.DueDate).FirstOrDefault();
            if (oldestDebt != null)
            {
                debtId = oldestDebt.Id;
            }
        }
        // Si es abono a deuda específica, validar que la deuda existe y pertenece al owner
        else if (request.Concept == PaymentConceptCodes.DebtPayment)
        {
            if (!request.DebtId.HasValue)
                return BadRequestError("DebtId es requerido para abonos a deuda");
            
            var debt = await _debtRepository.GetByIdAsync(request.DebtId.Value);
            if (debt == null || debt.OwnerId != ownerId)
                return BadRequestError("Deuda no encontrada o no pertenece al propietario");
            
            if (debt.IsPaid)
                return BadRequestError("La deuda ya está completamente pagada");
            
            if (request.Amount > debt.RemainingAmount.Amount)
                return BadRequestError($"El monto excede la deuda pendiente de {debt.RemainingAmount.Amount:C}");
            
            debtId = debt.Id;
        }

        // Crear el pago
        var money = new Money(request.Amount, request.Currency);
        var payment = new Payment(ownerId, request.Concept, money, request.PaymentDate, request.PaymentMethod, debtId);

        // Guardar comprobante si existe
        if (request.Receipt != null)
        {
            var receiptBase64 = await _fileService.ConvertToBase64Async(request.Receipt);
            payment.AddReceipt(receiptBase64);
        }

        await _paymentRepository.AddAsync(payment);

        // Si el pago está asociado a una deuda, marcarla como "PaymentSubmitted"
        if (debtId.HasValue)
        {
            var debt = await _debtRepository.GetByIdAsync(debtId.Value);
            if (debt != null)
            {
                debt.MarkAsPaymentSubmitted();
                await _debtRepository.UpdateAsync(debt);
            }
        }

        // Enviar notificación de pago recibido
        try
        {
            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.OwnerId == ownerId);
            if (user != null)
            {
                await _notificationService.SendPaymentReceivedNotificationAsync(
                    payment.Id, $"{user.FirstName} {user.LastName}", payment.Amount.Amount);
            }
        }
        catch (Exception ex)
        {
            // Log error but continue - notification failure shouldn't break payment creation
        }

        var response = new PaymentResponse
        {
            Id = payment.Id,
            OwnerId = payment.OwnerId,
            Concept = payment.Concept,
            DebtId = payment.DebtId,
            Amount = payment.Amount.Amount,
            Currency = payment.Amount.Currency,
            PaymentDate = payment.PaymentDate,
            PaymentMethod = payment.PaymentMethod,
            ReceiptUrl = payment.ReceiptData,
            Status = payment.Status,
            CreatedAt = payment.CreatedAt
        };

        return Created(response, _localization.GetMessage("PaymentCreated"));
    }

    [HttpPost("json")]
    public async Task<IActionResult> CreatePaymentJson(Guid ownerId, [FromBody] CreatePaymentJsonRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequestError(_localization.GetMessage("InvalidInputData"));

        if (!_fileService.IsValidReceiptFile(request.Receipt.FileName, request.Receipt.FileType, request.Receipt.FileContent))
            return BadRequestError(_localization.GetMessage("InvalidReceiptFile"));

        // Validar concepto
        var validConcepts = new[] { PaymentConceptCodes.Maintenance, PaymentConceptCodes.Advance, PaymentConceptCodes.DebtPayment };
        if (!validConcepts.Contains(request.Concept))
            return BadRequestError("Concepto de pago no válido");

        Guid? debtId = null;
        
        // Si es pago de mantenimiento, buscar la deuda más antigua pendiente
        if (request.Concept == PaymentConceptCodes.Maintenance)
        {
            var pendingDebts = await _debtRepository.GetPendingDebtsByOwnerIdAsync(ownerId);
            var oldestDebt = pendingDebts.OrderBy(d => d.DueDate).FirstOrDefault();
            if (oldestDebt != null)
            {
                debtId = oldestDebt.Id;
            }
        }
        // Si es abono a deuda específica, validar que la deuda existe y pertenece al owner
        else if (request.Concept == PaymentConceptCodes.DebtPayment)
        {
            if (!request.DebtId.HasValue)
                return BadRequestError("DebtId es requerido para abonos a deuda");
            
            var debt = await _debtRepository.GetByIdAsync(request.DebtId.Value);
            if (debt == null || debt.OwnerId != ownerId)
                return BadRequestError("Deuda no encontrada o no pertenece al propietario");
            
            if (debt.IsPaid)
                return BadRequestError("La deuda ya está completamente pagada");
            
            if (request.Amount > debt.RemainingAmount.Amount)
                return BadRequestError($"El monto excede la deuda pendiente de {debt.RemainingAmount.Amount:C}");
            
            debtId = debt.Id;
        }

        // Crear el pago
        var money = new Money(request.Amount, request.Currency);
        var payment = new Payment(ownerId, request.Concept, money, request.PaymentDate, request.PaymentMethod, debtId);

        // Guardar comprobante desde base64
        var receiptBase64 = _fileService.ConvertToBase64(
            request.Receipt.FileName, 
            request.Receipt.FileType, 
            request.Receipt.FileContent);
        payment.AddReceipt(receiptBase64);

        await _paymentRepository.AddAsync(payment);

        // Si el pago está asociado a una deuda, marcarla como "PaymentSubmitted"
        if (debtId.HasValue)
        {
            var debt = await _debtRepository.GetByIdAsync(debtId.Value);
            if (debt != null)
            {
                debt.MarkAsPaymentSubmitted();
                await _debtRepository.UpdateAsync(debt);
            }
        }

        // Enviar notificación de pago recibido
        try
        {
            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.OwnerId == ownerId);
            if (user != null)
            {
                await _notificationService.SendPaymentReceivedNotificationAsync(
                    payment.Id, $"{user.FirstName} {user.LastName}", payment.Amount.Amount);
            }
        }
        catch (Exception ex)
        {
            // Log error but continue - notification failure shouldn't break payment creation
        }

        var response = new PaymentResponse
        {
            Id = payment.Id,
            OwnerId = payment.OwnerId,
            Concept = payment.Concept,
            DebtId = payment.DebtId,
            Amount = payment.Amount.Amount,
            Currency = payment.Amount.Currency,
            PaymentDate = payment.PaymentDate,
            PaymentMethod = payment.PaymentMethod,
            ReceiptUrl = payment.ReceiptData,
            Status = payment.Status,
            CreatedAt = payment.CreatedAt
        };

        return Created(response, _localization.GetMessage("PaymentCreated"));
    }

    [HttpGet]
    public async Task<IActionResult> GetPayments(Guid ownerId)
    {
        var payments = await _paymentRepository.GetByOwnerIdAsync(ownerId);
        var paymentResponses = payments.Select(p => new PaymentResponse
        {
            Id = p.Id,
            OwnerId = p.OwnerId,
            Concept = p.Concept,
            DebtId = p.DebtId,
            Amount = p.Amount.Amount,
            Currency = p.Amount.Currency,
            PaymentDate = p.PaymentDate,
            PaymentMethod = p.PaymentMethod,
            ReceiptUrl = p.ReceiptData,
            Status = p.Status,
            RejectionReason = p.RejectionReason,
            CreatedAt = p.CreatedAt
        }).ToList();

        return Success(paymentResponses, _localization.GetMessage("PaymentsRetrieved"));
    }
}

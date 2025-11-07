using CondoFlow.Application.Common.Models;
using CondoFlow.Application.Common.Services;
using CondoFlow.Application.Common.DTOs.Payment;
using CondoFlow.Infrastructure.Repositories;
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
public class PaymentsController : ControllerBase
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
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse.ErrorResult(_localization.GetMessage("InvalidInputData"), 400));

            if (request.Receipt != null && !_fileService.IsValidReceiptFile(request.Receipt))
                return BadRequest(ApiResponse.ErrorResult(_localization.GetMessage("InvalidReceiptFile"), 400));

            // Validar concepto
            var validConcepts = new[] { "maintenance", "advance", "debt_payment" };
            if (!validConcepts.Contains(request.Concept))
                return BadRequest(ApiResponse.ErrorResult("Concepto de pago no válido", 400));

            Guid? debtId = null;
            
            // Si es pago de mantenimiento, buscar la deuda más antigua pendiente
            if (request.Concept == "maintenance")
            {
                var pendingDebts = await _debtRepository.GetPendingDebtsByOwnerIdAsync(ownerId);
                var oldestDebt = pendingDebts.OrderBy(d => d.DueDate).FirstOrDefault();
                if (oldestDebt != null)
                {
                    debtId = oldestDebt.Id;
                }
            }
            // Si es abono a deuda específica, validar que la deuda existe y pertenece al owner
            else if (request.Concept == "debt_payment")
            {
                if (!request.DebtId.HasValue)
                    return BadRequest(ApiResponse.ErrorResult("DebtId es requerido para abonos a deuda", 400));
                
                var debt = await _debtRepository.GetByIdAsync(request.DebtId.Value);
                if (debt == null || debt.OwnerId != ownerId)
                    return BadRequest(ApiResponse.ErrorResult("Deuda no encontrada o no pertenece al propietario", 400));
                
                if (debt.IsPaid)
                    return BadRequest(ApiResponse.ErrorResult("La deuda ya está completamente pagada", 400));
                
                if (request.Amount > debt.RemainingAmount.Amount)
                    return BadRequest(ApiResponse.ErrorResult($"El monto excede la deuda pendiente de {debt.RemainingAmount.Amount:C}", 400));
                
                debtId = debt.Id;
            }

            // Crear el pago
            var money = new Money(request.Amount, request.Currency);
            var payment = new Payment(ownerId, request.Concept, money, request.PaymentDate, request.PaymentMethod, debtId);

            // Guardar comprobante si existe
            if (request.Receipt != null)
            {
                var receiptUrl = await _fileService.SaveReceiptAsync(request.Receipt, ownerId, payment.Id);
                payment.AddReceipt(receiptUrl);
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
                ReceiptUrl = payment.ReceiptUrl,
                Status = payment.Status,
                CreatedAt = payment.CreatedAt
            };

            return Ok(ApiResponse<PaymentResponse>.SuccessResult(response, _localization.GetMessage("PaymentCreated"), 201));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult(_localization.GetMessage("PaymentError"), 500));
        }
    }

    [HttpPost("json")]
    public async Task<IActionResult> CreatePaymentJson(Guid ownerId, [FromBody] CreatePaymentJsonRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse.ErrorResult(_localization.GetMessage("InvalidInputData"), 400));

            if (!_fileService.IsValidReceiptFile(request.Receipt.FileName, request.Receipt.FileType, request.Receipt.FileContent))
                return BadRequest(ApiResponse.ErrorResult(_localization.GetMessage("InvalidReceiptFile"), 400));

            // Validar concepto
            var validConcepts = new[] { "maintenance", "advance", "debt_payment" };
            if (!validConcepts.Contains(request.Concept))
                return BadRequest(ApiResponse.ErrorResult("Concepto de pago no válido", 400));

            Guid? debtId = null;
            
            // Si es pago de mantenimiento, buscar la deuda más antigua pendiente
            if (request.Concept == "maintenance")
            {
                var pendingDebts = await _debtRepository.GetPendingDebtsByOwnerIdAsync(ownerId);
                var oldestDebt = pendingDebts.OrderBy(d => d.DueDate).FirstOrDefault();
                if (oldestDebt != null)
                {
                    debtId = oldestDebt.Id;
                }
            }
            // Si es abono a deuda específica, validar que la deuda existe y pertenece al owner
            else if (request.Concept == "debt_payment")
            {
                if (!request.DebtId.HasValue)
                    return BadRequest(ApiResponse.ErrorResult("DebtId es requerido para abonos a deuda", 400));
                
                var debt = await _debtRepository.GetByIdAsync(request.DebtId.Value);
                if (debt == null || debt.OwnerId != ownerId)
                    return BadRequest(ApiResponse.ErrorResult("Deuda no encontrada o no pertenece al propietario", 400));
                
                if (debt.IsPaid)
                    return BadRequest(ApiResponse.ErrorResult("La deuda ya está completamente pagada", 400));
                
                if (request.Amount > debt.RemainingAmount.Amount)
                    return BadRequest(ApiResponse.ErrorResult($"El monto excede la deuda pendiente de {debt.RemainingAmount.Amount:C}", 400));
                
                debtId = debt.Id;
            }

            // Crear el pago
            var money = new Money(request.Amount, request.Currency);
            var payment = new Payment(ownerId, request.Concept, money, request.PaymentDate, request.PaymentMethod, debtId);

            // Guardar comprobante desde base64
            var receiptUrl = await _fileService.SaveReceiptFromBase64Async(
                request.Receipt.FileName, 
                request.Receipt.FileType, 
                request.Receipt.FileContent, 
                ownerId, 
                payment.Id);
            payment.AddReceipt(receiptUrl);

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
                ReceiptUrl = payment.ReceiptUrl,
                Status = payment.Status,
                CreatedAt = payment.CreatedAt
            };

            return Ok(ApiResponse<PaymentResponse>.SuccessResult(response, _localization.GetMessage("PaymentCreated"), 201));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult(_localization.GetMessage("PaymentError"), 500));
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetPayments(Guid ownerId)
    {
        try
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
                ReceiptUrl = p.ReceiptUrl,
                Status = p.Status,
                RejectionReason = p.RejectionReason,
                CreatedAt = p.CreatedAt
            }).ToList();

            return Ok(ApiResponse<List<PaymentResponse>>.SuccessResult(paymentResponses, _localization.GetMessage("PaymentsRetrieved"), 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult(_localization.GetMessage("PaymentError"), 500));
        }
    }
}

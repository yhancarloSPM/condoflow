using CondoFlow.Application.Common.DTOs.Debt;
using CondoFlow.Application.Common.Models;
using CondoFlow.Domain.Entities;
using CondoFlow.Domain.ValueObjects;
using CondoFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/owners/{ownerId}/[controller]")]
[Authorize]
public class DebtsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DebtsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetOwnerDebts(string ownerId)
    {
        var userOwnerId = User.FindFirst("OwnerId")?.Value;
        
        if (string.IsNullOrEmpty(userOwnerId))
            return BadRequest(ApiResponse.ErrorResult("Usuario no aprobado o sin OwnerId asignado", 400));
        
        if (!string.Equals(userOwnerId, ownerId, StringComparison.OrdinalIgnoreCase))
            return Forbid();

        var debts = await _context.Debts
            .Where(d => d.OwnerId.ToString() == ownerId)
            .OrderByDescending(d => d.Year)
            .ThenByDescending(d => d.Month)
            .Select(d => new
            {
                d.Id,
                d.Amount.Amount,
                d.Amount.Currency,
                PaidAmount = d.PaidAmount.Amount,
                RemainingAmount = d.RemainingAmount.Amount,
                d.DueDate,
                d.Concept,
                d.Status,
                d.Month,
                d.Year,
                d.CreatedAt,
                IsOverdue = d.IsOverdue,
                IsPaid = d.IsPaid,
                IsPartiallyPaid = d.IsPartiallyPaid
            })
            .ToListAsync();

        var currentDebts = debts.Where(d => d.Status == "Pending" && !d.IsOverdue).ToList();
        var overdueDebts = debts.Where(d => d.Status != "PaymentSubmitted" && d.Status != "Paid" && d.IsOverdue).ToList();
        var paidDebts = debts.Where(d => d.Status == "Paid").ToList();
        var paymentSubmittedDebts = debts.Where(d => d.Status == "PaymentSubmitted").ToList();
        


        foreach(var debt in debts) {

        }



        var totalPending = currentDebts.Sum(d => d.RemainingAmount) + overdueDebts.Sum(d => d.RemainingAmount);

        var debtData = new
        {
            currentDebts,
            overdueDebts,
            paymentSubmittedDebts,
            paidDebts,
            totalPending,
            summary = new
            {
                totalCurrent = currentDebts.Count,
                totalOverdue = overdueDebts.Count,
                totalPaymentSubmitted = paymentSubmittedDebts.Count,
                totalPaid = paidDebts.Count
            }
        };
        return Ok(ApiResponse<object>.SuccessResult(debtData, "Deudas obtenidas exitosamente", 200));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateDebt(string ownerId, [FromBody] CreateDebtRequest request)
    {
        try
        {
            // Obtener el concepto de mantenimiento y el apartamento del owner
            var maintenanceConcept = await _context.PaymentConcepts
                .FirstOrDefaultAsync(c => c.Code == "maintenance" && c.IsActive);
            
            if (maintenanceConcept == null)
                return BadRequest(ApiResponse.ErrorResult("Concepto de mantenimiento no encontrado", 400));
            
            var user = await _context.Users
                .Include(u => u.ApartmentEntity)
                .FirstOrDefaultAsync(u => u.Id == ownerId);
            
            if (user?.ApartmentEntity == null)
                return BadRequest(ApiResponse.ErrorResult("Owner no tiene apartamento asignado", 400));
            
            // Determinar si es apartamento de azotea
            var isRoofApartment = user.ApartmentEntity.Number == "501" || user.ApartmentEntity.Number == "502";
            var amount = isRoofApartment ? maintenanceConcept.RoofAmount!.Value : maintenanceConcept.DefaultAmount!.Value;
            var dueDate = new DateTime(request.Year, request.Month, DateTime.DaysInMonth(request.Year, request.Month));
            
            var debt = new Debt
            {
                Id = Guid.NewGuid(),
                OwnerId = Guid.Parse(ownerId),
                Amount = new Money(amount, "DOP"),
                DueDate = dueDate,
                Concept = request.Concept,
                Month = request.Month,
                Year = request.Year,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Debts.Add(debt);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.SuccessResult(new { debtId = debt.Id }, "Deuda creada exitosamente", 201));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al crear la deuda", 500));
        }
    }
}

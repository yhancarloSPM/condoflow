using CondoFlow.Application.Common.Models;
using CondoFlow.Domain.Enums;
using CondoFlow.Infrastructure.Data;
using CondoFlow.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OwnersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;

    public OwnersController(UserManager<ApplicationUser> userManager, ApplicationDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    [HttpGet("{ownerId}")]
    public async Task<IActionResult> GetOwner(string ownerId)
    {
        try
        {

            
            // Buscar por Id primero
            var user = await _userManager.FindByIdAsync(ownerId);

            
            // Si no se encuentra, buscar por email (en caso de que ownerId sea email)
            if (user == null)
            {

                user = await _userManager.FindByEmailAsync(ownerId);

            }
            
            if (user == null)
            {

                return NotFound(ApiResponse.ErrorResult("Propietario no encontrado", 404));
            }


            
            var ownerData = new
            {
                id = user.Id,
                firstName = user.FirstName,
                lastName = user.LastName,
                email = user.Email,
                apartmentId = user.ApartmentId
            };

            return Ok(ApiResponse<object>.SuccessResult(ownerData, "Información del propietario obtenida exitosamente", 200));
        }
        catch (Exception ex)
        {

            return StatusCode(500, ApiResponse.ErrorResult($"Error al obtener información del propietario: {ex.Message}", 500));
        }
    }

    [HttpGet("debts-summary")]
    public async Task<IActionResult> GetOwnersSummary()
    {
        try
        {
            // Primero verificar si hay deudas
            var totalDebts = await _context.Debts.CountAsync();
            var pendingDebts = await _context.Debts.Where(d => d.Status == StatusPayments.Pending).CountAsync();
            var overdueDebts = await _context.Debts.Where(d => d.Status == StatusPayments.Overdue).CountAsync();
            
            // Debug info
            var debugInfo = new
            {
                totalDebts,
                pendingDebts,
                overdueDebts,
                allStatuses = await _context.Debts.Select(d => d.Status).Distinct().ToListAsync()
            };
            
            // Si no hay deudas activas, devolver info de debug
            if (pendingDebts == 0 && overdueDebts == 0)
            {
                return Ok(ApiResponse<object>.SuccessResult(new { owners = new object[0], debug = debugInfo }, "No hay deudas activas", 200));
            }

            // Obtener deudas activas (incluyendo las que tienen pagos en revisión)
            var activeDebts = await _context.Debts
                .Where(d => d.Status == StatusPayments.Pending || d.Status == StatusPayments.Overdue || d.Status == StatusPayments.PaymentSubmitted)
                .ToListAsync();

            // Actualizar status basado en IsOverdue
            foreach (var debt in activeDebts)
            {
                if (debt.IsOverdue && debt.Status == StatusPayments.Pending)
                {
                    debt.Status = StatusPayments.Overdue;
                }
            }

            // Obtener usuarios usando OwnerId
            var ownerIds = activeDebts.Select(d => d.OwnerId).Distinct().ToList();
            var users = await _context.Users
                .Where(u => u.OwnerId.HasValue && ownerIds.Contains(u.OwnerId.Value))
                .ToListAsync();

            // Hacer el JOIN en memoria
            var debtsWithOwners = activeDebts.Select(d => new
            {
                d = d,
                u = users.FirstOrDefault(u => u.OwnerId == d.OwnerId)
            }).ToList();
            
            // Agrupar en memoria
            var ownersSummary = debtsWithOwners
                .GroupBy(x => new { 
                    x.d.OwnerId, 
                    FirstName = x.u?.FirstName ?? "Usuario", 
                    LastName = x.u?.LastName ?? "no encontrado", 
                    ApartmentId = x.u?.ApartmentId
                })
                .Select(g => {
                    var apartmentInfo = "";
                    if (g.Key.ApartmentId.HasValue)
                    {
                        var apartment = _context.Apartments
                            .Include(a => a.Block)
                            .FirstOrDefault(a => a.Id == g.Key.ApartmentId.Value);
                        if (apartment != null)
                        {
                            apartmentInfo = $"{apartment.Block.Name}-{apartment.Number}";
                        }
                    }
                    
                    return new
                    {
                        ownerId = g.Key.OwnerId,
                        name = g.Key.FirstName + " " + g.Key.LastName,
                        apartment = apartmentInfo,
                        pendingAmount = g.Where(x => x.d.Status == StatusPayments.Pending).Sum(x => x.d.Amount.Amount),
                        overdueAmount = g.Where(x => x.d.Status == StatusPayments.Overdue || x.d.Status == StatusPayments.PaymentSubmitted).Sum(x => x.d.Amount.Amount),
                        totalAmount = g.Sum(x => x.d.Amount.Amount),
                        pendingCount = g.Count(x => x.d.Status == StatusPayments.Pending),
                        overdueCount = g.Count(x => x.d.Status == StatusPayments.Overdue || x.d.Status == StatusPayments.PaymentSubmitted),
                        lastUpdate = g.Max(x => x.d.CreatedAt)
                    };
                })
                .OrderByDescending(o => o.totalAmount)
                .ToList();

            return Ok(ApiResponse<object>.SuccessResult(ownersSummary, "Resumen de propietarios obtenido exitosamente", 200));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult($"Error al obtener resumen de propietarios: {ex.Message}", 500));
        }
    }

    [HttpGet("{ownerId}/debts-detail")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetOwnerDebts(string ownerId)
    {
        try
        {
            var ownerGuid = Guid.Parse(ownerId);
            
            var debts = await _context.Debts
                .Where(d => d.OwnerId == ownerGuid && (d.Status == StatusPayments.Pending || d.Status == StatusPayments.Overdue || d.Status == StatusPayments.PaymentSubmitted))
                .OrderByDescending(d => d.Year)
                .ThenByDescending(d => d.Month)
                .ToListAsync();

            var debtResponses = debts.Select(debt => new
            {
                id = debt.Id,
                concept = debt.Concept,
                amount = debt.Amount.Amount,
                currency = debt.Amount.Currency,
                month = debt.Month,
                year = debt.Year,
                dueDate = debt.DueDate,
                status = debt.IsOverdue ? StatusPayments.Overdue : debt.Status,
                createdAt = debt.CreatedAt
            }).ToList();

            return Ok(ApiResponse<object>.SuccessResult(debtResponses, "Deudas del propietario obtenidas exitosamente", 200));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult($"Error al obtener deudas del propietario: {ex.Message}", 500));
        }
    }
}

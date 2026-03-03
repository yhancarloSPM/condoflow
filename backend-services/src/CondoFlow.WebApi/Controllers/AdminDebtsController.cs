using CondoFlow.Application.Common.Models;
using CondoFlow.Domain.Enums;
using CondoFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/admin/debts")]
[Authorize(Roles = "Admin")]
public class AdminDebtsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminDebtsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllDebts()
    {
        try
        {
            var debts = await _context.Debts
                .OrderByDescending(d => d.Year)
                .ThenByDescending(d => d.Month)
                .ThenBy(d => d.CreatedAt)
                .ToListAsync();

            var debtResponses = new List<object>();

            foreach (var debt in debts)
            {
                var user = await _context.Users
                    .Include(u => u.ApartmentEntity)
                        .ThenInclude(a => a.Block)
                    .FirstOrDefaultAsync(u => u.OwnerId == debt.OwnerId);
                    
                var ownerName = user != null ? $"{user.FirstName} {user.LastName}" : "Usuario no encontrado";
                var apartment = "";
                if (user?.ApartmentEntity != null)
                {
                    apartment = $"{user.ApartmentEntity.Block.Name}-{user.ApartmentEntity.Number}";
                }

                debtResponses.Add(new
                {
                    Id = debt.Id,
                    OwnerId = debt.OwnerId,
                    OwnerName = ownerName,
                    Apartment = apartment,
                    Amount = debt.Amount.Amount,
                    Currency = debt.Amount.Currency,
                    Concept = debt.Concept,
                    Month = debt.Month,
                    Year = debt.Year,
                    DueDate = debt.DueDate,
                    Status = debt.IsOverdue ? StatusPayments.Overdue : debt.Status,
                    IsOverdue = debt.IsOverdue,
                    IsPaid = debt.IsPaid,
                    CreatedAt = debt.CreatedAt
                });
            }

            return Ok(ApiResponse<List<object>>.SuccessResult(debtResponses, "Deudas obtenidas exitosamente", 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al obtener las deudas", 500));
        }
    }

    [HttpPost("generate-year/{year}")]
    public async Task<IActionResult> GenerateYearDebts(int year)
    {
        try
        {
            var users = await _context.Users
                .Include(u => u.ApartmentEntity)
                .Where(u => u.OwnerId != null && u.IsApproved && u.ApartmentId != null)
                .ToListAsync();

            var debtsCreated = 0;

            for (int month = 1; month <= 12; month++)
            {
                foreach (var user in users)
                {
                    var existingDebt = await _context.Debts
                        .FirstOrDefaultAsync(d => d.OwnerId == user.OwnerId && 
                                                 d.Month == month && 
                                                 d.Year == year);

                    if (existingDebt == null)
                    {
                        var isRoofApartment = user.ApartmentEntity!.Number == "501" || user.ApartmentEntity.Number == "502";
                        var amount = isRoofApartment ? 1000 : 2000;
                        
                        var debt = new CondoFlow.Domain.Entities.Debt(
                            user.OwnerId.Value,
                            new CondoFlow.Domain.ValueObjects.Money(amount, "DOP"),
                            new DateTime(year, month, DateTime.DaysInMonth(year, month)),
                            $"Mantenimiento {GetMonthName(month)} {year}",
                            month,
                            year
                        );

                        _context.Debts.Add(debt);
                        debtsCreated++;
                    }
                }
            }

            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.SuccessResult(
                new { debtsCreated, totalUsers = users.Count }, 
                $"Generadas {debtsCreated} deudas para el año {year}", 
                200));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult($"Error: {ex.Message}", 500));
        }
    }

    private string GetMonthName(int month)
    {
        var months = new[] { "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                           "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre" };
        return months[month];
    }
}


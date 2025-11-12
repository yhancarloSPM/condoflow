using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CondoFlow.Infrastructure.Data;
using CondoFlow.Application.Common.Models;
using CondoFlow.Domain.Enums;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatusesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public StatusesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("reservation")]
    public async Task<ActionResult<ApiResponse<object>>> GetReservationStatuses()
    {
        try
        {
            var statuses = await _context.Statuses
                .Where(s => s.IsActive && (s.Code == "pending" || s.Code == "confirmed" || s.Code == "rejected" || s.Code == "cancelled"))
                .Select(s => new
                {
                    s.Id,
                    s.Code,
                    s.Name,
                    s.Description,
                    IsActive = s.IsActive
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.SuccessResult(statuses, "Estados de reserva obtenidos exitosamente"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResult("Error interno del servidor", 500));
        }
    }

    [HttpGet("incident")]
    public async Task<ActionResult<ApiResponse<object>>> GetIncidentStatuses()
    {
        try
        {
            var statuses = await _context.Statuses
                .Where(s => s.IsActive && (s.Name == IncidentStatusNames.Reported || s.Name == IncidentStatusNames.InProgress || s.Name == IncidentStatusNames.Resolved || s.Name == IncidentStatusNames.Rejected || s.Name == IncidentStatusNames.Cancelled))
                .Select(s => new
                {
                    s.Id,
                    s.Code,
                    s.Name,
                    s.Description,
                    IsActive = s.IsActive
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.SuccessResult(statuses, "Estados de incidencia obtenidos exitosamente"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResult("Error interno del servidor", 500));
        }
    }

    [HttpGet("expense")]
    public async Task<ActionResult<ApiResponse<object>>> GetExpenseStatuses()
    {
        try
        {
            var statuses = await _context.Statuses
                .Where(s => s.IsActive && (s.Code == "pending" || s.Code == "confirmed" || s.Code == "paid" || s.Code == "rejected" || s.Code == "cancelled"))
                .Select(s => new
                {
                    Id = s.Id,
                    s.Code,
                    s.Name,
                    s.Description,
                    IsActive = s.IsActive
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.SuccessResult(statuses, "Estados de gasto obtenidos exitosamente"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResult("Error interno del servidor", 500));
        }
    }
}
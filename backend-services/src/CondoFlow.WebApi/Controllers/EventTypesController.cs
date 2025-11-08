using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CondoFlow.Infrastructure.Data;
using CondoFlow.Application.Common.Models;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventTypesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public EventTypesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetEventTypes()
    {
        try
        {
            var eventTypes = await _context.EventTypes
                .Where(et => et.IsActive)
                .OrderBy(et => et.Order)
                .Select(et => new
                {
                    et.Id,
                    et.Code,
                    et.Name,
                    et.Description,
                    et.Order,
                    IsActive = et.IsActive
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.SuccessResult(eventTypes, "Tipos de evento obtenidos exitosamente"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResult("Error interno del servidor", 500));
        }
    }
}
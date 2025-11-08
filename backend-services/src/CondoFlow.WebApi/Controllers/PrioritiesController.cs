using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CondoFlow.Infrastructure.Data;
using CondoFlow.Application.Common.Models;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PrioritiesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PrioritiesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetPriorities()
    {
        try
        {
            var priorities = await _context.Priorities
                .Where(p => p.IsActive)
                .OrderBy(p => p.Name)
                .Select(p => new
                {
                    p.Id,
                    p.Code,
                    p.Name,
                    p.Description,
                    IsActive = p.IsActive
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.SuccessResult(priorities, "Prioridades obtenidas exitosamente"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResult("Error interno del servidor", 500));
        }
    }
}
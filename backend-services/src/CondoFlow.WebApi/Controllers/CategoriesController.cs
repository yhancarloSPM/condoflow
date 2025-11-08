using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CondoFlow.Infrastructure.Data;
using CondoFlow.Application.Common.Models;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CategoriesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetCategories()
    {
        try
        {
            var categories = await _context.Categories
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .Select(c => new
                {
                    c.Id,
                    c.Code,
                    c.Name,
                    c.Description,
                    IsActive = c.IsActive
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.SuccessResult(categories, "Categorías obtenidas exitosamente"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.ErrorResult("Error interno del servidor", 500));
        }
    }
}
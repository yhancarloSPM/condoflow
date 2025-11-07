using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CondoFlow.Infrastructure.Data;
using CondoFlow.Application.Common.Models;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CatalogsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CatalogsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("categories")]
    public async Task<ActionResult<ApiResponse<List<CatalogDto>>>> GetCategories()
    {
        try
        {
            var categories = await _context.Categories
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .Select(c => new CatalogDto
                {
                    Id = c.Id.ToString(),
                    Code = c.Code,
                    Name = c.Name,
                    Description = c.Description,
                    IsActive = c.IsActive
                })
                .ToListAsync();

            return Ok(ApiResponse<List<CatalogDto>>.SuccessResult(categories));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<List<CatalogDto>>.ErrorResult($"Error al obtener categorías: {ex.Message}", 500));
        }
    }

    [HttpGet("priorities")]
    public async Task<ActionResult<ApiResponse<List<CatalogDto>>>> GetPriorities()
    {
        try
        {
            var priorities = await _context.Priorities
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .Select(c => new CatalogDto
                {
                    Id = c.Id.ToString(),
                    Code = c.Code,
                    Name = c.Name,
                    Description = c.Description,
                    IsActive = c.IsActive
                })
                .ToListAsync();

            return Ok(ApiResponse<List<CatalogDto>>.SuccessResult(priorities));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<List<CatalogDto>>.ErrorResult($"Error al obtener prioridades: {ex.Message}", 500));
        }
    }

    [HttpGet("statuses")]
    public async Task<ActionResult<ApiResponse<List<CatalogDto>>>> GetStatuses()
    {
        try
        {
            var statuses = await _context.Statuses
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .Select(c => new CatalogDto
                {
                    Id = c.Id.ToString(),
                    Code = c.Code,
                    Name = c.Name,
                    Description = c.Description,
                    IsActive = c.IsActive
                })
                .ToListAsync();

            return Ok(ApiResponse<List<CatalogDto>>.SuccessResult(statuses));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<List<CatalogDto>>.ErrorResult($"Error al obtener estados: {ex.Message}", 500));
        }
    }
}

public class CatalogDto
{
    public string Id { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int? Order { get; set; }
}
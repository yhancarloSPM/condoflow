using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CondoFlow.Infrastructure.Data;
using CondoFlow.Application.Common.Models;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ApartmentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ApartmentsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetApartments()
    {
        try
        {
            var apartments = await _context.Apartments
                .Include(a => a.Block)
                .Where(a => a.IsActive)
                .OrderBy(a => a.Block.Name)
                .ThenBy(a => a.Number)
                .Select(a => new { 
                    a.Id, 
                    a.Number, 
                    a.Floor,
                    BlockName = a.Block.Name,
                    BlockId = a.BlockId
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.SuccessResult(apartments, "Apartamentos obtenidos exitosamente", 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al obtener los apartamentos", 500));
        }
    }

    [HttpGet("by-block/{blockName}")]
    public async Task<IActionResult> GetApartmentsByBlock(string blockName)
    {
        try
        {
            var apartments = await _context.Apartments
                .Include(a => a.Block)
                .Where(a => a.IsActive && a.Block.Name == blockName)
                .OrderBy(a => a.Number)
                .Select(a => new { a.Id, a.Number, a.Floor })
                .ToListAsync();

            return Ok(ApiResponse<object>.SuccessResult(apartments, "Apartamentos obtenidos exitosamente", 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al obtener los apartamentos", 500));
        }
    }

    [HttpGet("{apartmentId}")]
    public async Task<IActionResult> GetApartmentById(int apartmentId)
    {
        try
        {
            var apartment = await _context.Apartments
                .Include(a => a.Block)
                .FirstOrDefaultAsync(a => a.Id == apartmentId && a.IsActive);

            if (apartment == null)
            {
                return NotFound(ApiResponse.ErrorResult("Apartamento no encontrado", 404));
            }

            var apartmentInfo = new
            {
                apartment.Id,
                apartment.Number,
                apartment.Floor,
                BlockName = apartment.Block.Name,
                apartment.BlockId,
                apartment.MonthlyMaintenanceAmount,
                FullName = $"{apartment.Block.Name}-{apartment.Number}"
            };

            return Ok(ApiResponse<object>.SuccessResult(apartmentInfo, "Apartamento obtenido exitosamente", 200));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult($"Error al obtener el apartamento: {ex.Message}", 500));
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CondoFlow.Infrastructure.Data;
using CondoFlow.Application.Common.Models;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BlocksController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public BlocksController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetBlocks()
    {
        try
        {
            var blocks = await _context.Blocks
                .Where(b => b.IsActive)
                .OrderBy(b => b.Name)
                .Select(b => new { b.Id, b.Name, b.Description })
                .ToListAsync();

            return Ok(ApiResponse<object>.SuccessResult(blocks, "Bloques obtenidos exitosamente", 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al obtener los bloques", 500));
        }
    }
}

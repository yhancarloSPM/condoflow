using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Common.Models;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BlocksController : ControllerBase
{
    private readonly IBlockRepository _blockRepository;

    public BlocksController(IBlockRepository blockRepository)
    {
        _blockRepository = blockRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetBlocks()
    {
        try
        {
            var blocks = await _blockRepository.GetAllBlocksAsync();
            var blocksDto = blocks.Select(b => new { b.Id, b.Name, b.Description });
            return Ok(ApiResponse<object>.SuccessResult(blocksDto, "Bloques obtenidos exitosamente", 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al obtener los bloques", 500));
        }
    }
}

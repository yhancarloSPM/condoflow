using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Common.Models;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BlocksController : BaseApiController
{
    private readonly IBlockRepository _blockRepository;

    public BlocksController(IBlockRepository blockRepository)
    {
        _blockRepository = blockRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetBlocks()
    {
        var blocks = await _blockRepository.GetAllBlocksAsync();
        var blocksDto = blocks.Select(b => new { b.Id, b.Name, b.Description });
        return Success(blocksDto, "Bloques obtenidos exitosamente");
    }
}

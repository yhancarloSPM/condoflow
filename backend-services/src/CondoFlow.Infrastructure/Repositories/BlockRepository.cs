using CondoFlow.Domain.Entities;
using CondoFlow.Infrastructure.Data;
using CondoFlow.Application.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Repositories;

public class BlockRepository : IBlockRepository
{
    private readonly ApplicationDbContext _context;

    public BlockRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Block>> GetAllBlocksAsync()
    {
        return await _context.Blocks
            .Where(b => b.IsActive)
            .OrderBy(b => b.Name)
            .ToListAsync();
    }

    public async Task<Block?> GetBlockByIdAsync(int id)
    {
        return await _context.Blocks.FindAsync(id);
    }
}

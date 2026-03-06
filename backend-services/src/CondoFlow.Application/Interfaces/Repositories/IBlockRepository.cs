using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Interfaces.Repositories;

public interface IBlockRepository
{
    Task<IEnumerable<Block>> GetAllBlocksAsync();
    Task<Block?> GetBlockByIdAsync(int id);
}

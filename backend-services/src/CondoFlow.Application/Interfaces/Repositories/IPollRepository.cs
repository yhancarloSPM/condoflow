using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Interfaces.Repositories;

public interface IPollRepository
{
    Task<IEnumerable<Poll>> GetActiveAsync();
    Task<Poll?> GetByIdAsync(int id);
    Task<Poll> AddAsync(Poll poll);
    Task UpdateAsync(Poll poll);
    Task<bool> HasVotesAsync(int pollId);
    Task<int> GetOwnerCountAsync();
}

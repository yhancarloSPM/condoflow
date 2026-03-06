using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Interfaces.Repositories;

public interface IPollOptionRepository
{
    Task<IEnumerable<PollOption>> GetByPollIdAsync(int pollId);
    Task<PollOption?> GetByIdAsync(int id);
    Task<PollOption> AddAsync(PollOption option);
    Task DeleteRangeAsync(IEnumerable<PollOption> options);
    Task AddRangeAsync(IEnumerable<PollOption> options);
}

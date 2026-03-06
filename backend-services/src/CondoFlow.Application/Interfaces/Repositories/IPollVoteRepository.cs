using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Interfaces.Repositories;

public interface IPollVoteRepository
{
    Task<IEnumerable<PollVote>> GetByPollIdAsync(int pollId);
    Task<IEnumerable<PollVote>> GetByPollIdAndUserIdAsync(int pollId, string userId);
    Task<PollVote> AddAsync(PollVote vote);
    Task AddRangeAsync(IEnumerable<PollVote> votes);
    Task DeleteRangeAsync(IEnumerable<PollVote> votes);
}

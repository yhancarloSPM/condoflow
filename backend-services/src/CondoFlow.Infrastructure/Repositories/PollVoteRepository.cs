using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Domain.Entities;
using CondoFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Repositories;

public class PollVoteRepository : IPollVoteRepository
{
    private readonly ApplicationDbContext _context;

    public PollVoteRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PollVote>> GetByPollIdAsync(int pollId)
    {
        return await _context.PollVotes
            .Where(v => v.PollId == pollId)
            .ToListAsync();
    }

    public async Task<IEnumerable<PollVote>> GetByPollIdAndUserIdAsync(int pollId, string userId)
    {
        return await _context.PollVotes
            .Where(v => v.PollId == pollId && v.UserId == userId)
            .ToListAsync();
    }

    public async Task<PollVote> AddAsync(PollVote vote)
    {
        _context.PollVotes.Add(vote);
        await _context.SaveChangesAsync();
        return vote;
    }

    public async Task AddRangeAsync(IEnumerable<PollVote> votes)
    {
        _context.PollVotes.AddRange(votes);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteRangeAsync(IEnumerable<PollVote> votes)
    {
        _context.PollVotes.RemoveRange(votes);
        await _context.SaveChangesAsync();
    }
}

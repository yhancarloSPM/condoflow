using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Domain.Entities;
using CondoFlow.Domain.Enums;
using CondoFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Repositories;

public class PollRepository : IPollRepository
{
    private readonly ApplicationDbContext _context;

    public PollRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Poll>> GetActiveAsync()
    {
        return await _context.Polls
            .Include(p => p.Options)
                .ThenInclude(o => o.Votes)
            .Include(p => p.Votes)
            .Where(p => p.IsActive && !p.IsDeleted)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<Poll?> GetByIdAsync(int id)
    {
        return await _context.Polls
            .Include(p => p.Options)
                .ThenInclude(o => o.Votes)
            .Include(p => p.Votes)
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive && !p.IsDeleted);
    }

    public async Task<Poll> AddAsync(Poll poll)
    {
        _context.Polls.Add(poll);
        await _context.SaveChangesAsync();
        return poll;
    }

    public async Task UpdateAsync(Poll poll)
    {
        _context.Polls.Update(poll);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> HasVotesAsync(int pollId)
    {
        return await _context.PollVotes.AnyAsync(v => v.PollId == pollId);
    }

    public async Task<int> GetOwnerCountAsync()
    {
        return await _context.Users
            .Where(u => _context.UserRoles
                .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
                .Any(ur => ur.UserId == u.Id && ur.Name == UserRoles.Owner))
            .CountAsync();
    }
}

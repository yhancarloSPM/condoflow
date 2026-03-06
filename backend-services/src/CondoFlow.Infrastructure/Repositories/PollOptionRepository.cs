using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Domain.Entities;
using CondoFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Repositories;

public class PollOptionRepository : IPollOptionRepository
{
    private readonly ApplicationDbContext _context;

    public PollOptionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PollOption>> GetByPollIdAsync(int pollId)
    {
        return await _context.PollOptions
            .Where(o => o.PollId == pollId)
            .OrderBy(o => o.Order)
            .ToListAsync();
    }

    public async Task<PollOption?> GetByIdAsync(int id)
    {
        return await _context.PollOptions.FindAsync(id);
    }

    public async Task<PollOption> AddAsync(PollOption option)
    {
        _context.PollOptions.Add(option);
        await _context.SaveChangesAsync();
        return option;
    }

    public async Task DeleteRangeAsync(IEnumerable<PollOption> options)
    {
        _context.PollOptions.RemoveRange(options);
        await _context.SaveChangesAsync();
    }

    public async Task AddRangeAsync(IEnumerable<PollOption> options)
    {
        _context.PollOptions.AddRange(options);
        await _context.SaveChangesAsync();
    }
}

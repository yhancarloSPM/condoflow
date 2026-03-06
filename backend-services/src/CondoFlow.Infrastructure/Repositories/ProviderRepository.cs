using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Domain.Entities;
using CondoFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Repositories;

public class ProviderRepository : IProviderRepository
{
    private readonly ApplicationDbContext _context;

    public ProviderRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Provider>> GetAllAsync()
    {
        return await _context.Providers
            .OrderBy(p => p.Name)
            .ToListAsync();
    }

    public async Task<IEnumerable<Provider>> GetActiveAsync()
    {
        return await _context.Providers
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .ToListAsync();
    }

    public async Task<Provider?> GetByIdAsync(int id)
    {
        return await _context.Providers.FindAsync(id);
    }

    public async Task<Provider> AddAsync(Provider provider)
    {
        _context.Providers.Add(provider);
        await _context.SaveChangesAsync();
        return provider;
    }

    public async Task UpdateAsync(Provider provider)
    {
        _context.Providers.Update(provider);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var provider = await _context.Providers.FindAsync(id);
        if (provider != null)
        {
            _context.Providers.Remove(provider);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> HasExpensesAsync(int id)
    {
        return await _context.Expenses.AnyAsync(e => e.ProviderId == id);
    }
}

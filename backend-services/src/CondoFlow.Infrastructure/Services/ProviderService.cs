using CondoFlow.Application.DTOs;
using CondoFlow.Domain.Entities;
using CondoFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Services;

public class ProviderService : IProviderService
{
    private readonly ApplicationDbContext _context;

    public ProviderService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ProviderDto>> GetAllProvidersAsync()
    {
        return await _context.Providers
            .OrderBy(p => p.Name)
            .Select(p => new ProviderDto
            {
                Id = p.Id,
                Name = p.Name,
                Phone = p.Phone,
                Email = p.Email,
                RNC = p.RNC,
                Address = p.Address,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                CreatedBy = p.CreatedBy
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<ProviderDto>> GetActiveProvidersAsync()
    {
        return await _context.Providers
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .Select(p => new ProviderDto
            {
                Id = p.Id,
                Name = p.Name,
                Phone = p.Phone,
                Email = p.Email,
                RNC = p.RNC,
                Address = p.Address,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                CreatedBy = p.CreatedBy
            })
            .ToListAsync();
    }

    public async Task<ProviderDto?> GetProviderByIdAsync(int id)
    {
        var provider = await _context.Providers.FindAsync(id);
        if (provider == null) return null;

        return new ProviderDto
        {
            Id = provider.Id,
            Name = provider.Name,
            Phone = provider.Phone,
            Email = provider.Email,
            RNC = provider.RNC,
            Address = provider.Address,
            IsActive = provider.IsActive,
            CreatedAt = provider.CreatedAt,
            CreatedBy = provider.CreatedBy
        };
    }

    public async Task<ProviderDto> CreateProviderAsync(CreateProviderDto createDto, string userId)
    {
        var provider = new Provider
        {
            Name = createDto.Name,
            Phone = createDto.Phone,
            Email = createDto.Email,
            RNC = createDto.RNC,
            Address = createDto.Address,
            IsActive = true,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Providers.Add(provider);
        await _context.SaveChangesAsync();

        return new ProviderDto
        {
            Id = provider.Id,
            Name = provider.Name,
            Phone = provider.Phone,
            Email = provider.Email,
            RNC = provider.RNC,
            Address = provider.Address,
            IsActive = provider.IsActive,
            CreatedAt = provider.CreatedAt,
            CreatedBy = provider.CreatedBy
        };
    }

    public async Task<ProviderDto?> UpdateProviderAsync(int id, UpdateProviderDto updateDto)
    {
        var provider = await _context.Providers.FindAsync(id);
        if (provider == null) return null;

        provider.Name = updateDto.Name;
        provider.Phone = updateDto.Phone;
        provider.Email = updateDto.Email;
        provider.RNC = updateDto.RNC;
        provider.Address = updateDto.Address;
        provider.IsActive = updateDto.IsActive;

        await _context.SaveChangesAsync();

        return new ProviderDto
        {
            Id = provider.Id,
            Name = provider.Name,
            Phone = provider.Phone,
            Email = provider.Email,
            RNC = provider.RNC,
            Address = provider.Address,
            IsActive = provider.IsActive,
            CreatedAt = provider.CreatedAt,
            CreatedBy = provider.CreatedBy
        };
    }

    public async Task<bool> DeleteProviderAsync(int id)
    {
        var provider = await _context.Providers.FindAsync(id);
        if (provider == null) return false;

        // Check if provider has expenses
        var hasExpenses = await _context.Expenses.AnyAsync(e => e.ProviderId == id);
        if (hasExpenses)
        {
            // Soft delete - just deactivate
            provider.IsActive = false;
            await _context.SaveChangesAsync();
        }
        else
        {
            // Hard delete if no expenses
            _context.Providers.Remove(provider);
            await _context.SaveChangesAsync();
        }

        return true;
    }
}
using CondoFlow.Domain.Entities;
using CondoFlow.Infrastructure.Data;
using CondoFlow.Application.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Repositories;

public class ApartmentRepository : IApartmentRepository
{
    private readonly ApplicationDbContext _context;

    public ApartmentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<object>> GetAllApartmentsAsync()
    {
        return await _context.Apartments
            .Include(a => a.Block)
            .Where(a => a.IsActive)
            .OrderBy(a => a.Block.Name)
            .ThenBy(a => a.Number)
            .Select(a => new
            {
                id = a.Id,
                number = a.Number,
                floor = a.Floor,
                blockName = a.Block.Name,
                blockId = a.BlockId
            })
            .ToListAsync();
    }

    public async Task<Apartment?> GetApartmentByIdAsync(int id)
    {
        return await _context.Apartments
            .Include(a => a.Block)
            .FirstOrDefaultAsync(a => a.Id == id && a.IsActive);
    }

    public async Task<IEnumerable<object>> GetApartmentsByBlockAsync(int blockId)
    {
        return await _context.Apartments
            .Where(a => a.BlockId == blockId && a.IsActive)
            .OrderBy(a => a.Number)
            .Select(a => new
            {
                id = a.Id,
                number = a.Number,
                floor = a.Floor
            })
            .ToListAsync();
    }

    public async Task<Apartment?> GetByIdAsync(int id)
    {
        return await GetApartmentByIdAsync(id);
    }

    public async Task<object?> GetApartmentWithBlockAsync(int id)
    {
        return await _context.Apartments
            .Include(a => a.Block)
            .FirstOrDefaultAsync(a => a.Id == id && a.IsActive);
    }
}
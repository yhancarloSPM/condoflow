using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Domain.Enums;
using CondoFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Repositories;

public class StatusRepository : IStatusRepository
{
    private readonly ApplicationDbContext _context;

    public StatusRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<object>> GetExpenseStatusesAsync()
    {
        var statuses = await _context.Statuses
            .Where(s => s.IsActive && (
                s.Code == StatusCodes.Pending || 
                s.Code == StatusCodes.Confirmed || 
                s.Code == StatusCodes.Paid || 
                s.Code == StatusCodes.Rejected || 
                s.Code == StatusCodes.Cancelled))
            .OrderBy(s => s.Name)
            .ToListAsync();
            
        return statuses.Select(s => new
        {
            Id = s.Id,
            Name = s.Name,
            Code = s.Code,
            IsActive = s.IsActive
        });
    }

    public async Task<object?> GetStatusByCodeAsync(string code)
    {
        var status = await _context.Statuses
            .FirstOrDefaultAsync(s => s.Code == code);
            
        if (status == null)
            return null;

        return new
        {
            Id = status.Id,
            Name = status.Name,
            Code = status.Code,
            IsActive = status.IsActive
        };
    }
}

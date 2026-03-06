using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Domain.Enums;
using CondoFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Repositories;

public class CatalogRepository : ICatalogRepository
{
    private readonly ApplicationDbContext _context;

    public CatalogRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<object>> GetCategoriesAsync()
    {
        return await _context.Categories
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new
            {
                c.Id,
                c.Code,
                c.Name,
                c.Description,
                IsActive = c.IsActive
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<object>> GetEventTypesAsync()
    {
        return await _context.EventTypes
            .Where(et => et.IsActive)
            .OrderBy(et => et.Name)
            .Select(et => new
            {
                et.Id,
                et.Code,
                et.Name,
                et.Description,
                IsActive = et.IsActive
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<object>> GetPaymentConceptsAsync()
    {
        return await _context.PaymentConcepts
            .Where(c => c.IsActive)
            .Select(c => new
            {
                value = c.Code,
                label = c.Name,
                amount = c.DefaultAmount,
                roofAmount = c.RoofAmount,
                autoAmount = c.IsAutoCalculated
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<object>> GetPrioritiesAsync()
    {
        return await _context.Priorities
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .Select(p => new
            {
                p.Id,
                p.Code,
                p.Name,
                p.Description,
                IsActive = p.IsActive
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<object>> GetReservationStatusesAsync()
    {
        return await _context.Statuses
            .Where(s => s.IsActive && (s.Code == StatusCodes.Pending || s.Code == StatusCodes.Confirmed || s.Code == StatusCodes.Rejected || s.Code == StatusCodes.Cancelled))
            .Select(s => new
            {
                s.Id,
                s.Code,
                s.Name,
                s.Description,
                IsActive = s.IsActive
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<object>> GetIncidentStatusesAsync()
    {
        return await _context.Statuses
            .Where(s => s.IsActive && (s.Name == IncidentStatusNames.Reported || s.Name == IncidentStatusNames.InProgress || s.Name == IncidentStatusNames.Resolved || s.Name == IncidentStatusNames.Rejected || s.Name == IncidentStatusNames.Cancelled))
            .Select(s => new
            {
                s.Id,
                s.Code,
                s.Name,
                s.Description,
                IsActive = s.IsActive
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<object>> GetExpenseStatusesAsync()
    {
        return await _context.Statuses
            .Where(s => s.IsActive && (s.Code == StatusCodes.Pending || s.Code == StatusCodes.Confirmed || s.Code == StatusCodes.Paid || s.Code == StatusCodes.Rejected || s.Code == StatusCodes.Cancelled))
            .Select(s => new
            {
                Id = s.Id,
                s.Code,
                s.Name,
                s.Description,
                IsActive = s.IsActive
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<object>> GetAnnouncementTypesAsync()
    {
        return await _context.AnnouncementTypes
            .Where(t => t.IsActive)
            .OrderBy(t => t.Name)
            .Select(t => new { t.Id, t.Name, t.Code })
            .ToListAsync();
    }
}

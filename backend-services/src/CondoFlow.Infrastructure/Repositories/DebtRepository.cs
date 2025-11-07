using CondoFlow.Domain.Entities;
using CondoFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Repositories;

public interface IDebtRepository
{
    Task<Debt> AddAsync(Debt debt);
    Task<List<Debt>> GetByOwnerIdAsync(Guid ownerId);
    Task<List<Debt>> GetPendingDebtsByOwnerIdAsync(Guid ownerId);
    Task<Debt?> GetByIdAsync(Guid id);
    Task UpdateAsync(Debt debt);
}

public class DebtRepository : IDebtRepository
{
    private readonly ApplicationDbContext _context;

    public DebtRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Debt> AddAsync(Debt debt)
    {
        _context.Debts.Add(debt);
        await _context.SaveChangesAsync();
        return debt;
    }

    public async Task<List<Debt>> GetByOwnerIdAsync(Guid ownerId)
    {
        return await _context.Debts
            .Where(d => d.OwnerId == ownerId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    public async Task<Debt?> GetByIdAsync(Guid id)
    {
        return await _context.Debts.FindAsync(id);
    }

    public async Task UpdateAsync(Debt debt)
    {
        _context.Debts.Update(debt);
        await _context.SaveChangesAsync();
    }

    public async Task<List<Debt>> GetPendingDebtsByOwnerIdAsync(Guid ownerId)
    {
        return await _context.Debts
            .Where(d => d.OwnerId == ownerId && 
                   (d.Status == "Pending" || d.Status == "Overdue" || d.Status == "PaymentSubmitted") &&
                   d.Status != "Paid")
            .OrderBy(d => d.DueDate)
            .ToListAsync();
    }
}
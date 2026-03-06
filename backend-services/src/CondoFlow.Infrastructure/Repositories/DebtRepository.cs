using CondoFlow.Domain.Entities;
using CondoFlow.Domain.Enums;
using CondoFlow.Infrastructure.Data;
using CondoFlow.Application.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Repositories;

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
                   (d.Status == StatusPayments.Pending || d.Status == StatusPayments.Overdue || d.Status == StatusPayments.PaymentSubmitted) &&
                   d.Status != StatusPayments.Paid)
            .OrderBy(d => d.DueDate)
            .ToListAsync();
    }

    public async Task<List<Debt>> GetDebtsByOwnerIdAsync(Guid ownerId)
    {
        return await GetByOwnerIdAsync(ownerId);
    }

    public async Task<List<Debt>> GetActiveDebtsAsync()
    {
        var debts = await _context.Debts
            .Where(d => d.Status == StatusPayments.Pending || d.Status == StatusPayments.Overdue || d.Status == StatusPayments.PaymentSubmitted)
            .ToListAsync();

        // Actualizar status basado en IsOverdue
        foreach (var debt in debts)
        {
            if (debt.IsOverdue && debt.Status == StatusPayments.Pending)
            {
                debt.Status = StatusPayments.Overdue;
            }
        }

        return debts;
    }

    public async Task<int> CountAsync()
    {
        return await _context.Debts.CountAsync();
    }

    public async Task<List<Debt>> GetAllAsync()
    {
        return await _context.Debts
            .OrderByDescending(d => d.Year)
            .ThenByDescending(d => d.Month)
            .ThenBy(d => d.CreatedAt)
            .ToListAsync();
    }
}
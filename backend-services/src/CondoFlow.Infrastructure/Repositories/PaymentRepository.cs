using CondoFlow.Domain.Entities;
using CondoFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Repositories;

public interface IPaymentRepository
{
    Task<Payment> AddAsync(Payment payment);
    Task<List<Payment>> GetByOwnerIdAsync(Guid ownerId);
    Task<Payment?> GetByIdAsync(Guid paymentId);
    Task UpdateAsync(Payment payment);
    Task<List<Payment>> GetAllAsync();
}

public class PaymentRepository : IPaymentRepository
{
    private readonly ApplicationDbContext _context;

    public PaymentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Payment> AddAsync(Payment payment)
    {
        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();
        return payment;
    }

    public async Task<List<Payment>> GetByOwnerIdAsync(Guid ownerId)
    {
        return await _context.Payments
            .Where(p => p.OwnerId == ownerId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<Payment?> GetByIdAsync(Guid paymentId)
    {
        return await _context.Payments.FindAsync(paymentId);
    }

    public async Task UpdateAsync(Payment payment)
    {
        _context.Payments.Update(payment);
        await _context.SaveChangesAsync();
    }

    public async Task<List<Payment>> GetAllAsync()
    {
        return await _context.Payments
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }
}
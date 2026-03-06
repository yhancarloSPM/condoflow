using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Domain.Entities;
using CondoFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Repositories;

public class PaymentConceptRepository : IPaymentConceptRepository
{
    private readonly ApplicationDbContext _context;

    public PaymentConceptRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaymentConcept?> GetByCodeAsync(string code)
    {
        return await _context.PaymentConcepts
            .FirstOrDefaultAsync(c => c.Code == code && c.IsActive);
    }
}

using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Interfaces.Repositories;

public interface IPaymentRepository
{
    Task<Payment> AddAsync(Payment payment);
    Task<List<Payment>> GetByOwnerIdAsync(Guid ownerId);
    Task<Payment?> GetByIdAsync(Guid paymentId);
    Task UpdateAsync(Payment payment);
    Task<List<Payment>> GetAllAsync();
}

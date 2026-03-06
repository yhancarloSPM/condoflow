using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Interfaces.Repositories;

public interface IDebtRepository
{
    Task<Debt> AddAsync(Debt debt);
    Task<List<Debt>> GetByOwnerIdAsync(Guid ownerId);
    Task<List<Debt>> GetDebtsByOwnerIdAsync(Guid ownerId);
    Task<List<Debt>> GetPendingDebtsByOwnerIdAsync(Guid ownerId);
    Task<List<Debt>> GetActiveDebtsAsync();
    Task<Debt?> GetByIdAsync(Guid id);
    Task UpdateAsync(Debt debt);
    Task<int> CountAsync();
    Task<List<Debt>> GetAllAsync();
}

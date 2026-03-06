using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Interfaces.Repositories;

public interface IProviderRepository
{
    Task<IEnumerable<Provider>> GetAllAsync();
    Task<IEnumerable<Provider>> GetActiveAsync();
    Task<Provider?> GetByIdAsync(int id);
    Task<Provider> AddAsync(Provider provider);
    Task UpdateAsync(Provider provider);
    Task DeleteAsync(int id);
    Task<bool> HasExpensesAsync(int id);
}

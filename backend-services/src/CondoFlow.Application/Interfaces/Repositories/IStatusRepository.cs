namespace CondoFlow.Application.Interfaces.Repositories;

public interface IStatusRepository
{
    Task<IEnumerable<object>> GetExpenseStatusesAsync();
    Task<object?> GetStatusByCodeAsync(string code);
}

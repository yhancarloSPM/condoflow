namespace CondoFlow.Application.Interfaces.Repositories;

public interface IExpenseCategoryRepository
{
    Task<IEnumerable<object>> GetActiveCategoriesAsync();
}

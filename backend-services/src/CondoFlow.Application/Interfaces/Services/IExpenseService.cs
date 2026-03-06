using CondoFlow.Application.DTOs;

namespace CondoFlow.Application.Interfaces.Services;

public interface IExpenseService
{
    Task<IEnumerable<ExpenseDto>> GetAllExpensesAsync();
    Task<ExpenseDto?> GetExpenseByIdAsync(int id);
    Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto createDto, string userId, string? invoiceUrl = null);
    Task<ExpenseDto?> UpdateExpenseAsync(int id, UpdateExpenseDto updateDto, string? invoiceUrl = null);
    Task<bool> DeleteExpenseAsync(int id);
    Task<IEnumerable<ExpenseCategoryDto>> GetCategoriesAsync();
    Task<IEnumerable<ExpenseStatusDto>> GetStatusesAsync();
}

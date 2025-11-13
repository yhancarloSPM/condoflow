using CondoFlow.Application.DTOs;
using CondoFlow.Domain.Entities;
using CondoFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Services;

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

public class ExpenseService : IExpenseService
{
    private readonly ApplicationDbContext _context;

    public ExpenseService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ExpenseDto>> GetAllExpensesAsync()
    {
        var expenses = await _context.Expenses
            .Include(e => e.Category)
            .Include(e => e.Status)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
            
        return expenses.Select(e => new ExpenseDto
        {
            Id = e.Id,
            Description = e.Description,
            Amount = e.Amount,
            Date = e.Date,
            CategoryId = e.CategoryId,
            CategoryName = e.Category.Name,
            StatusId = e.StatusId,
            StatusName = e.Status.Name,
            StatusClass = GetStatusClass(e.Status.Code),
            Provider = e.Provider,
            Notes = e.Notes,
            InvoiceUrl = e.InvoiceUrl,
            CreatedBy = e.CreatedBy,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt
        });
    }

    public async Task<ExpenseDto?> GetExpenseByIdAsync(int id)
    {
        var expense = await _context.Expenses
            .Include(e => e.Category)
            .Include(e => e.Status)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (expense == null) return null;

        return new ExpenseDto
        {
            Id = expense.Id,
            Description = expense.Description,
            Amount = expense.Amount,
            Date = expense.Date,
            CategoryId = expense.CategoryId,
            CategoryName = expense.Category.Name,
            StatusId = expense.StatusId,
            StatusName = expense.Status.Name,
            StatusClass = GetStatusClass(expense.Status.Code),
            Provider = expense.Provider,
            Notes = expense.Notes,
            InvoiceUrl = expense.InvoiceUrl,
            CreatedBy = expense.CreatedBy,
            CreatedAt = expense.CreatedAt,
            UpdatedAt = expense.UpdatedAt
        };
    }

    public async Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto createDto, string userId, string? invoiceUrl = null)
    {
        // Obtener el estado "pending"
        var pendingStatus = await _context.Statuses.FirstOrDefaultAsync(s => s.Code == "pending");
        if (pendingStatus == null) throw new InvalidOperationException("Estado 'pending' no encontrado");
        
        var expense = new Expense
        {
            Description = createDto.Description,
            Amount = createDto.Amount,
            Date = createDto.Date,
            CategoryId = createDto.CategoryId,
            StatusId = pendingStatus.Id, // Siempre crear en estado pendiente
            Provider = createDto.Provider ?? string.Empty,
            Notes = createDto.Notes,
            InvoiceUrl = invoiceUrl,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync();

        return await GetExpenseByIdAsync(expense.Id) ?? throw new InvalidOperationException("Failed to create expense");
    }

    public async Task<ExpenseDto?> UpdateExpenseAsync(int id, UpdateExpenseDto updateDto, string? invoiceUrl = null)
    {
        var expense = await _context.Expenses.FindAsync(id);
        if (expense == null) return null;

        // Si se proporciona una nueva URL de factura, actualizarla
        if (invoiceUrl != null)
        {
            expense.InvoiceUrl = invoiceUrl;
        }

        expense.Description = updateDto.Description;
        expense.Amount = updateDto.Amount;
        expense.Date = updateDto.Date;
        expense.CategoryId = updateDto.CategoryId;
        expense.StatusId = updateDto.StatusId;
        expense.Provider = updateDto.Provider;
        expense.Notes = updateDto.Notes;
        expense.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetExpenseByIdAsync(id);
    }

    public async Task<bool> DeleteExpenseAsync(int id)
    {
        var expense = await _context.Expenses.FindAsync(id);
        if (expense == null) return false;

        _context.Expenses.Remove(expense);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<ExpenseCategoryDto>> GetCategoriesAsync()
    {
        return await _context.ExpenseCategories
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new ExpenseCategoryDto
            {
                Id = c.Id,
                Name = c.Name,

                IsActive = c.IsActive
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<ExpenseStatusDto>> GetStatusesAsync()
    {
        var statuses = await _context.Statuses
            .Where(s => s.IsActive && (s.Code == "pending" || s.Code == "confirmed" || s.Code == "paid" || s.Code == "rejected" || s.Code == "cancelled"))
            .OrderBy(s => s.Name)
            .ToListAsync();
            
        return statuses.Select(s => new ExpenseStatusDto
        {
            Id = s.Id,
            Name = s.Name,
            Code = s.Code,
            IsActive = s.IsActive
        });
    }
    
    private string GetStatusClass(string statusCode)
    {
        return statusCode.ToLower() switch
        {
            "pending" => "pending",
            "confirmed" => "approved",
            "paid" => "paid",
            "rejected" => "rejected",
            "cancelled" => "rejected",
            _ => "pending"
        };
    }
    

}
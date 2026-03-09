using AutoMapper;
using CondoFlow.Application.DTOs;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Domain.Entities;
using CondoFlow.Domain.Enums;

namespace CondoFlow.Application.Services;

public class ExpenseService : IExpenseService
{
    private readonly IExpenseRepository _expenseRepository;
    private readonly IExpenseCategoryRepository _categoryRepository;
    private readonly IStatusRepository _statusRepository;
    private readonly IMapper _mapper;

    public ExpenseService(
        IExpenseRepository expenseRepository,
        IExpenseCategoryRepository categoryRepository,
        IStatusRepository statusRepository,
        IMapper mapper)
    {
        _expenseRepository = expenseRepository;
        _categoryRepository = categoryRepository;
        _statusRepository = statusRepository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ExpenseDto>> GetAllExpensesAsync()
    {
        var expenses = await _expenseRepository.GetAllAsync();
        return _mapper.Map<IEnumerable<ExpenseDto>>(expenses);
    }

    public async Task<ExpenseDto?> GetExpenseByIdAsync(int id)
    {
        var expense = await _expenseRepository.GetByIdAsync(id);
        return expense != null ? _mapper.Map<ExpenseDto>(expense) : null;
    }

    public async Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto createDto, string createdBy, string? invoiceUrl = null)
    {
        // Obtener el estado "pending"
        var pendingStatus = await _statusRepository.GetStatusByCodeAsync(StatusCodes.Pending);
        if (pendingStatus == null) throw new InvalidOperationException("Estado 'pending' no encontrado");
        
        dynamic statusData = pendingStatus;
        
        // Mapear usando AutoMapper
        var expense = _mapper.Map<Expense>(createDto);
        expense.StatusId = statusData.Id;
        expense.InvoiceUrl = invoiceUrl;
        expense.CreatedBy = createdBy;
        expense.CreatedAt = DateTime.UtcNow;

        await _expenseRepository.AddAsync(expense);
        return await GetExpenseByIdAsync(expense.Id) ?? throw new InvalidOperationException("Failed to create expense");
    }

    public async Task<ExpenseDto?> UpdateExpenseAsync(int id, UpdateExpenseDto updateDto, string? invoiceUrl = null)
    {
        var expense = await _expenseRepository.GetByIdAsync(id);
        if (expense == null) return null;

        // Mapear usando AutoMapper
        _mapper.Map(updateDto, expense);
        
        if (invoiceUrl != null)
        {
            expense.InvoiceUrl = invoiceUrl;
        }
        
        expense.UpdatedAt = DateTime.UtcNow;

        await _expenseRepository.UpdateAsync(expense);
        return await GetExpenseByIdAsync(id);
    }

    public async Task<bool> DeleteExpenseAsync(int id)
    {
        var expense = await _expenseRepository.GetByIdAsync(id);
        if (expense == null) return false;

        await _expenseRepository.DeleteAsync(id);
        return true;
    }

    public async Task<IEnumerable<ExpenseCategoryDto>> GetCategoriesAsync()
    {
        var categories = await _categoryRepository.GetActiveCategoriesAsync();
        var categoriesArray = categories as object[] ?? categories.ToArray();
        return categoriesArray.Select(c => _mapper.Map<ExpenseCategoryDto>(c));
    }

    public async Task<IEnumerable<ExpenseStatusDto>> GetStatusesAsync()
    {
        var statuses = await _statusRepository.GetExpenseStatusesAsync();
        var statusesArray = statuses as object[] ?? statuses.ToArray();
        return statusesArray.Select(s => _mapper.Map<ExpenseStatusDto>(s));
    }
}

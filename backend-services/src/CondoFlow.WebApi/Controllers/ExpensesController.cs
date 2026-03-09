using CondoFlow.Application.DTOs;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Application.Common.Models;
using CondoFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExpensesController : BaseApiController
{
    private readonly IExpenseService _expenseService;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<ExpensesController> _logger;

    public ExpensesController(
        IExpenseService expenseService, 
        IWebHostEnvironment environment,
        ILogger<ExpensesController> logger)
    {
        _expenseService = expenseService;
        _environment = environment;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetExpenses()
    {
        var expenses = await _expenseService.GetAllExpensesAsync();
        return Success(expenses, "Gastos obtenidos exitosamente");
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetExpense(int id)
    {
        var expense = await _expenseService.GetExpenseByIdAsync(id);
        if (expense == null)
            return NotFoundError<ExpenseDto>("Gasto no encontrado");

        return Success(expense, "Gasto obtenido exitosamente");
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> CreateExpense([FromForm] CreateExpenseDto createDto, [FromForm] IFormFile? invoice)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return UnauthorizedError("Usuario no autenticado");

        string? invoiceUrl = null;
        if (invoice != null)
        {
            invoiceUrl = await SaveInvoiceFileAsync(invoice);
        }

        var expense = await _expenseService.CreateExpenseAsync(createDto, userId, invoiceUrl);
        return Created(expense, "Gasto creado exitosamente");
    }

    [HttpPut("{id}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> UpdateExpense(int id, [FromForm] UpdateExpenseDto updateDto, [FromForm] IFormFile? invoice)
    {
        string? invoiceUrl = null;
        if (invoice != null)
        {
            // Obtener el gasto actual para eliminar la factura anterior si existe
            var currentExpense = await _expenseService.GetExpenseByIdAsync(id);
            if (currentExpense != null && !string.IsNullOrEmpty(currentExpense.InvoiceUrl))
            {
                DeleteInvoiceFile(currentExpense.InvoiceUrl);
            }
            invoiceUrl = await SaveInvoiceFileAsync(invoice);
        }

        var expense = await _expenseService.UpdateExpenseAsync(id, updateDto, invoiceUrl);
        if (expense == null)
            return NotFoundError<ExpenseDto>("Gasto no encontrado");

        return Success(expense, "Gasto actualizado exitosamente");
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> DeleteExpense(int id)
    {
        var deleted = await _expenseService.DeleteExpenseAsync(id);
        if (!deleted)
            return NotFoundError("Gasto no encontrado");

        return Success<object>(null, "Gasto eliminado exitosamente");
    }
    
    private async Task<string> SaveInvoiceFileAsync(IFormFile file)
    {
        var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "invoices");
        Directory.CreateDirectory(uploadsFolder);
        
        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadsFolder, fileName);
        
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }
        
        return $"/uploads/invoices/{fileName}";
    }
    
    private void DeleteInvoiceFile(string invoiceUrl)
    {
        try
        {
            var filePath = Path.Combine(_environment.WebRootPath, invoiceUrl.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
                _logger.LogInformation("Invoice file deleted successfully: {FilePath}", filePath);
            }
        }
        catch (Exception ex)
        {
            // Log error but don't throw - file deletion shouldn't break the operation
            _logger.LogWarning(ex, "Failed to delete invoice file: {InvoiceUrl}", invoiceUrl);
        }
    }
}

[ApiController]
[Route("api/expense-categories")]
[Authorize]
public class ExpenseCategoriesController : BaseApiController
{
    private readonly IExpenseService _expenseService;

    public ExpenseCategoriesController(IExpenseService expenseService)
    {
        _expenseService = expenseService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _expenseService.GetCategoriesAsync();
        return Success(categories, "Categorías obtenidas exitosamente");
    }
}


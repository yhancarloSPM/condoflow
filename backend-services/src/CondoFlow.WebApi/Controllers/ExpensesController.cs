using CondoFlow.Application.DTOs;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Application.Common.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _expenseService;
    private readonly IWebHostEnvironment _environment;

    public ExpensesController(IExpenseService expenseService, IWebHostEnvironment environment)
    {
        _expenseService = expenseService;
        _environment = environment;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<ExpenseDto>>>> GetExpenses()
    {
        try
        {
            var expenses = await _expenseService.GetAllExpensesAsync();
            return Ok(new ApiResponse<IEnumerable<ExpenseDto>>
            {
                Success = true,
                Data = expenses,
                Message = "Gastos obtenidos exitosamente"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<IEnumerable<ExpenseDto>>
            {
                Success = false,
                Message = $"Error interno del servidor: {ex.Message}"
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> GetExpense(int id)
    {
        try
        {
            var expense = await _expenseService.GetExpenseByIdAsync(id);
            if (expense == null)
            {
                return NotFound(new ApiResponse<ExpenseDto>
                {
                    Success = false,
                    Message = "Gasto no encontrado"
                });
            }

            return Ok(new ApiResponse<ExpenseDto>
            {
                Success = true,
                Data = expense,
                Message = "Gasto obtenido exitosamente"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<ExpenseDto>
            {
                Success = false,
                Message = $"Error interno del servidor: {ex.Message}"
            });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> CreateExpense([FromForm] CreateExpenseDto createDto, [FromForm] IFormFile? invoice)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<ExpenseDto>
                {
                    Success = false,
                    Message = "Usuario no autenticado"
                });
            }

            string? invoiceUrl = null;
            if (invoice != null)
            {
                invoiceUrl = await SaveInvoiceFileAsync(invoice);
            }

            var expense = await _expenseService.CreateExpenseAsync(createDto, userId, invoiceUrl);
            return CreatedAtAction(nameof(GetExpense), new { id = expense.Id }, new ApiResponse<ExpenseDto>
            {
                Success = true,
                Data = expense,
                Message = "Gasto creado exitosamente"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<ExpenseDto>
            {
                Success = false,
                Message = $"Error interno del servidor: {ex.Message}"
            });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> UpdateExpense(int id, [FromForm] UpdateExpenseDto updateDto, [FromForm] IFormFile? invoice)
    {
        try
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
            {
                return NotFound(new ApiResponse<ExpenseDto>
                {
                    Success = false,
                    Message = "Gasto no encontrado"
                });
            }

            return Ok(new ApiResponse<ExpenseDto>
            {
                Success = true,
                Data = expense,
                Message = "Gasto actualizado exitosamente"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<ExpenseDto>
            {
                Success = false,
                Message = $"Error interno del servidor: {ex.Message}"
            });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteExpense(int id)
    {
        try
        {
            var deleted = await _expenseService.DeleteExpenseAsync(id);
            if (!deleted)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Gasto no encontrado"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Gasto eliminado exitosamente"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error interno del servidor: {ex.Message}"
            });
        }
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
            }
        }
        catch (Exception ex)
        {
            // Log error but don't throw - file deletion shouldn't break the operation
            Console.WriteLine($"Error deleting invoice file: {ex.Message}");
        }
    }
}

[ApiController]
[Route("api/expense-categories")]
[Authorize]
public class ExpenseCategoriesController : ControllerBase
{
    private readonly IExpenseService _expenseService;

    public ExpenseCategoriesController(IExpenseService expenseService)
    {
        _expenseService = expenseService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<ExpenseCategoryDto>>>> GetCategories()
    {
        try
        {
            var categories = await _expenseService.GetCategoriesAsync();
            return Ok(new ApiResponse<IEnumerable<ExpenseCategoryDto>>
            {
                Success = true,
                Data = categories,
                Message = "Categorías obtenidas exitosamente"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<IEnumerable<ExpenseCategoryDto>>
            {
                Success = false,
                Message = $"Error interno del servidor: {ex.Message}"
            });
        }
    }
}


using CondoFlow.Application.DTOs;
using CondoFlow.Infrastructure.Services;
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

    public ExpensesController(IExpenseService expenseService)
    {
        _expenseService = expenseService;
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
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> CreateExpense(CreateExpenseDto createDto)
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

            var expense = await _expenseService.CreateExpenseAsync(createDto, userId);
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
    public async Task<ActionResult<ApiResponse<ExpenseDto>>> UpdateExpense(int id, UpdateExpenseDto updateDto)
    {
        try
        {
            var expense = await _expenseService.UpdateExpenseAsync(id, updateDto);
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


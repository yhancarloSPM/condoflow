using CondoFlow.Application.Common.Models;
using CondoFlow.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/admin/debts")]
[Authorize(Roles = "Admin")]
public class AdminDebtsController : ControllerBase
{
    private readonly IDebtService _debtService;

    public AdminDebtsController(IDebtService debtService)
    {
        _debtService = debtService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllDebts()
    {
        try
        {
            var debtResponses = await _debtService.GetAllDebtsAsync();
            return Ok(ApiResponse<object>.SuccessResult(debtResponses, "Deudas obtenidas exitosamente", 200));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al obtener las deudas", 500));
        }
    }

    [HttpPost("generate-year/{year}")]
    public async Task<IActionResult> GenerateYearDebts(int year)
    {
        try
        {
            var result = await _debtService.GenerateYearDebtsAsync(year);
            return Ok(ApiResponse<object>.SuccessResult(result, $"Deudas generadas para el año {year}", 200));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult($"Error: {ex.Message}", 500));
        }
    }
}


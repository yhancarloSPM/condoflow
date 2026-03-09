using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/admin/debts")]
[Authorize(Roles = UserRoles.Admin)]
public class AdminDebtsController : BaseApiController
{
    private readonly IDebtService _debtService;

    public AdminDebtsController(IDebtService debtService)
    {
        _debtService = debtService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllDebts()
    {
        var debtResponses = await _debtService.GetAllDebtsAsync();
        return Success(debtResponses, "Deudas obtenidas exitosamente");
    }

    [HttpPost("generate-year/{year}")]
    public async Task<IActionResult> GenerateYearDebts(int year)
    {
        var result = await _debtService.GenerateYearDebtsAsync(year);
        return Success(result, $"Deudas generadas para el año {year}");
    }
}
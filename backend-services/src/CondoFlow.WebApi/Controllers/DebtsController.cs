using CondoFlow.Application.Common.DTOs.Debt;
using CondoFlow.Application.Common.Models;
using CondoFlow.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/owners/{ownerId}/[controller]")]
[Authorize]
public class DebtsController : ControllerBase
{
    private readonly IDebtService _debtService;

    public DebtsController(IDebtService debtService)
    {
        _debtService = debtService;
    }

    [HttpGet]
    public async Task<IActionResult> GetOwnerDebts(string ownerId)
    {
        var userOwnerId = User.FindFirst("OwnerId")?.Value;
        
        if (string.IsNullOrEmpty(userOwnerId))
            return BadRequest(ApiResponse.ErrorResult("Usuario no aprobado o sin OwnerId asignado", 400));
        
        if (!string.Equals(userOwnerId, ownerId, StringComparison.OrdinalIgnoreCase))
            return Forbid();

        if (!Guid.TryParse(ownerId, out var ownerGuid))
            return BadRequest(ApiResponse.ErrorResult("OwnerId inválido", 400));

        var debtData = await _debtService.GetOwnerDebtsAsync(ownerGuid);
        return Ok(ApiResponse<object>.SuccessResult(debtData, "Deudas obtenidas exitosamente", 200));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateDebt(string ownerId, [FromBody] CreateDebtRequest request)
    {
        try
        {
            if (!Guid.TryParse(ownerId, out var ownerGuid))
                return BadRequest(ApiResponse.ErrorResult("OwnerId inválido", 400));

            var debtId = await _debtService.CreateDebtAsync(ownerGuid, request.Month, request.Year, request.Concept);
            return Ok(ApiResponse<object>.SuccessResult(new { debtId }, "Deuda creada exitosamente", 201));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse.ErrorResult(ex.Message, 400));
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error al crear la deuda", 500));
        }
    }
}

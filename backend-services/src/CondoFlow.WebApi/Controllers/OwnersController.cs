using CondoFlow.Application.Common.Models;
using CondoFlow.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OwnersController : ControllerBase
{
    private readonly IOwnerService _ownerService;

    public OwnersController(IOwnerService ownerService)
    {
        _ownerService = ownerService;
    }

    [HttpGet("{ownerId}")]
    public async Task<IActionResult> GetOwner(string ownerId)
    {
        try
        {
            var ownerData = await _ownerService.GetOwnerByIdAsync(ownerId);
            if (ownerData == null)
                return NotFound(ApiResponse.ErrorResult("Propietario no encontrado", 404));

            return Ok(ApiResponse<object>.SuccessResult(ownerData, "Información del propietario obtenida exitosamente", 200));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult($"Error al obtener información del propietario: {ex.Message}", 500));
        }
    }

    [HttpGet("debts-summary")]
    public async Task<IActionResult> GetOwnersSummary()
    {
        try
        {
            var ownersSummary = await _ownerService.GetOwnersSummaryAsync();
            return Ok(ApiResponse<object>.SuccessResult(ownersSummary, "Resumen de propietarios obtenido exitosamente", 200));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult($"Error al obtener resumen de propietarios: {ex.Message}", 500));
        }
    }

    [HttpGet("{ownerId}/debts-detail")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetOwnerDebts(string ownerId)
    {
        try
        {
            var ownerGuid = Guid.Parse(ownerId);
            var debtResponses = await _ownerService.GetOwnerDebtsDetailAsync(ownerGuid);
            return Ok(ApiResponse<object>.SuccessResult(debtResponses, "Deudas del propietario obtenidas exitosamente", 200));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult($"Error al obtener deudas del propietario: {ex.Message}", 500));
        }
    }
}

using CondoFlow.Application.Common.DTOs.Debt;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/owners/{ownerId}/[controller]")]
[Authorize]
public class DebtsController : BaseApiController
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
            return BadRequestError("Usuario no aprobado o sin OwnerId asignado");
        
        if (!string.Equals(userOwnerId, ownerId, StringComparison.OrdinalIgnoreCase))
            return ForbiddenError("No tiene permisos para acceder a estas deudas");

        if (!Guid.TryParse(ownerId, out var ownerGuid))
            return BadRequestError("OwnerId inválido");

        var debtData = await _debtService.GetOwnerDebtsAsync(ownerGuid);
        return Success(debtData, "Deudas obtenidas exitosamente");
    }

    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> CreateDebt(string ownerId, [FromBody] CreateDebtRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequestError("Datos inválidos");

        if (!Guid.TryParse(ownerId, out var ownerGuid))
            return BadRequestError("OwnerId inválido");

        var debtId = await _debtService.CreateDebtAsync(request, ownerGuid);
        return Created(new { debtId }, "Deuda creada exitosamente");
    }
}

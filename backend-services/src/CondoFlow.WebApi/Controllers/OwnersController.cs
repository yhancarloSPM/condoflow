using CondoFlow.Application.Common.Models;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OwnersController : BaseApiController
{
    private readonly IOwnerService _ownerService;

    public OwnersController(IOwnerService ownerService)
    {
        _ownerService = ownerService;
    }

    [HttpGet("{ownerId}")]
    public async Task<IActionResult> GetOwner(string ownerId)
    {
        var ownerData = await _ownerService.GetOwnerByIdAsync(ownerId);
        if (ownerData == null)
            return NotFoundError("Propietario no encontrado");

        return Success(ownerData, "Información del propietario obtenida exitosamente");
    }

    [HttpGet("debts-summary")]
    public async Task<IActionResult> GetOwnersSummary()
    {
        var ownersSummary = await _ownerService.GetOwnersSummaryAsync();
        return Success(ownersSummary, "Resumen de propietarios obtenido exitosamente");
    }

    [HttpGet("{ownerId}/debts-detail")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> GetOwnerDebts(string ownerId)
    {
        var ownerGuid = Guid.Parse(ownerId);
        var debtResponses = await _ownerService.GetOwnerDebtsDetailAsync(ownerGuid);
        return Success(debtResponses, "Deudas del propietario obtenidas exitosamente");
    }
}

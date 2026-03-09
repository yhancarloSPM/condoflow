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
public class ProvidersController : BaseApiController
{
    private readonly IProviderService _providerService;

    public ProvidersController(IProviderService providerService)
    {
        _providerService = providerService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProviders()
    {
        var providers = await _providerService.GetAllProvidersAsync();
        return Success(providers, "Proveedores obtenidos exitosamente");
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActiveProviders()
    {
        var providers = await _providerService.GetActiveProvidersAsync();
        return Success(providers, "Proveedores activos obtenidos exitosamente");
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProvider(int id)
    {
        var provider = await _providerService.GetProviderByIdAsync(id);
        if (provider == null)
            return NotFoundError<ProviderDto>("Proveedor no encontrado");

        return Success(provider, "Proveedor obtenido exitosamente");
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateProvider(CreateProviderDto createDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return UnauthorizedError("Usuario no autenticado");

        var provider = await _providerService.CreateProviderAsync(createDto, userId);
        return Created(provider, "Proveedor creado exitosamente");
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateProvider(int id, UpdateProviderDto updateDto)
    {
        var provider = await _providerService.UpdateProviderAsync(id, updateDto);
        if (provider == null)
            return NotFoundError<ProviderDto>("Proveedor no encontrado");

        return Success(provider, "Proveedor actualizado exitosamente");
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteProvider(int id)
    {
        var deleted = await _providerService.DeleteProviderAsync(id);
        if (!deleted)
            return NotFoundError("Proveedor no encontrado");

        return Success<object>(null!, "Proveedor eliminado exitosamente");
    }
}
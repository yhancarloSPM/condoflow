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
public class ProvidersController : ControllerBase
{
    private readonly IProviderService _providerService;

    public ProvidersController(IProviderService providerService)
    {
        _providerService = providerService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<ProviderDto>>>> GetProviders()
    {
        try
        {
            var providers = await _providerService.GetAllProvidersAsync();
            return Ok(new ApiResponse<IEnumerable<ProviderDto>>
            {
                Success = true,
                Data = providers,
                Message = "Proveedores obtenidos exitosamente"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<IEnumerable<ProviderDto>>
            {
                Success = false,
                Message = $"Error interno del servidor: {ex.Message}"
            });
        }
    }

    [HttpGet("active")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ProviderDto>>>> GetActiveProviders()
    {
        try
        {
            var providers = await _providerService.GetActiveProvidersAsync();
            return Ok(new ApiResponse<IEnumerable<ProviderDto>>
            {
                Success = true,
                Data = providers,
                Message = "Proveedores activos obtenidos exitosamente"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<IEnumerable<ProviderDto>>
            {
                Success = false,
                Message = $"Error interno del servidor: {ex.Message}"
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ProviderDto>>> GetProvider(int id)
    {
        try
        {
            var provider = await _providerService.GetProviderByIdAsync(id);
            if (provider == null)
            {
                return NotFound(new ApiResponse<ProviderDto>
                {
                    Success = false,
                    Message = "Proveedor no encontrado"
                });
            }

            return Ok(new ApiResponse<ProviderDto>
            {
                Success = true,
                Data = provider,
                Message = "Proveedor obtenido exitosamente"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<ProviderDto>
            {
                Success = false,
                Message = $"Error interno del servidor: {ex.Message}"
            });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<ProviderDto>>> CreateProvider(CreateProviderDto createDto)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ApiResponse<ProviderDto>
                {
                    Success = false,
                    Message = "Usuario no autenticado"
                });
            }

            var provider = await _providerService.CreateProviderAsync(createDto, userId);
            return CreatedAtAction(nameof(GetProvider), new { id = provider.Id }, new ApiResponse<ProviderDto>
            {
                Success = true,
                Data = provider,
                Message = "Proveedor creado exitosamente"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<ProviderDto>
            {
                Success = false,
                Message = $"Error interno del servidor: {ex.Message}"
            });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<ProviderDto>>> UpdateProvider(int id, UpdateProviderDto updateDto)
    {
        try
        {
            var provider = await _providerService.UpdateProviderAsync(id, updateDto);
            if (provider == null)
            {
                return NotFound(new ApiResponse<ProviderDto>
                {
                    Success = false,
                    Message = "Proveedor no encontrado"
                });
            }

            return Ok(new ApiResponse<ProviderDto>
            {
                Success = true,
                Data = provider,
                Message = "Proveedor actualizado exitosamente"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<ProviderDto>
            {
                Success = false,
                Message = $"Error interno del servidor: {ex.Message}"
            });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteProvider(int id)
    {
        try
        {
            var deleted = await _providerService.DeleteProviderAsync(id);
            if (!deleted)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Proveedor no encontrado"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Proveedor eliminado exitosamente"
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
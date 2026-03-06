using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Domain.Entities;
using CondoFlow.WebApi.DTOs;
using CondoFlow.Application.Common.Models;
using System.Security.Claims;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IncidentsController : ControllerBase
{
    private readonly IIncidentService _incidentService;

    public IncidentsController(IIncidentService incidentService)
    {
        _incidentService = incidentService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateIncident([FromForm] CreateIncidentRequest request, IFormFile? image = null)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse.ErrorResult("Usuario no autenticado", 401));
            }

            string? imageData = null;
            if (image != null)
            {
                // Validar imagen
                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
                if (!allowedTypes.Contains(image.ContentType.ToLower()))
                {
                    return BadRequest(ApiResponse.ErrorResult("Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG y GIF.", 400));
                }
                
                if (image.Length > 5 * 1024 * 1024) // 5MB
                {
                    return BadRequest(ApiResponse.ErrorResult("La imagen no puede ser mayor a 5MB.", 400));
                }
                
                // Convertir imagen a base64
                using var memoryStream = new MemoryStream();
                await image.CopyToAsync(memoryStream);
                var fileBytes = memoryStream.ToArray();
                var base64String = Convert.ToBase64String(fileBytes);
                imageData = $"data:{image.ContentType};base64,{base64String}";
            }

            var incident = await _incidentService.CreateIncidentAsync(userId, request.Title, request.Description, request.Category, request.Priority, imageData);

            var response = new {
                id = incident.Id,
                title = incident.Title,
                description = incident.Description,
                category = incident.Category,
                priority = incident.Priority,
                status = incident.Status,
                createdAt = incident.CreatedAt
            };
            return Ok(ApiResponse<object>.SuccessResult(response, "Incidencia reportada exitosamente", 201));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error interno del servidor", 500));
        }
    }

    [HttpGet("my-incidents")]
    public async Task<IActionResult> GetMyIncidents()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse.ErrorResult("Usuario no autenticado", 401));
            }

            var incidents = await _incidentService.GetMyIncidentsAsync(userId);
            return Ok(ApiResponse<object>.SuccessResult(incidents, "Incidencias obtenidas exitosamente", 200));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error interno del servidor", 500));
        }
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllIncidents()
    {
        try
        {
            var incidents = await _incidentService.GetAllIncidentsAsync();
            return Ok(ApiResponse<object>.SuccessResult(incidents, "Incidencias obtenidas exitosamente", 200));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error interno del servidor", 500));
        }
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateIncidentStatus(Guid id, [FromBody] UpdateIncidentStatusRequest request)
    {
        try
        {
            await _incidentService.UpdateIncidentStatusAsync(id, request.Status, request.AdminComment);
            return Ok(ApiResponse<object>.SuccessResult(null, "Estado de incidencia actualizado exitosamente", 200));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse.ErrorResult("Incidencia no encontrada", 404));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error interno del servidor", 500));
        }
    }

    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> CancelIncident(Guid id, [FromBody] CancelIncidentRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse.ErrorResult("Usuario no autenticado", 401));
            }

            await _incidentService.CancelIncidentAsync(id, userId, request.Comment);
            return Ok(ApiResponse<object>.SuccessResult(null, "Incidencia cancelada exitosamente", 200));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse.ErrorResult("Incidencia no encontrada", 404));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse.ErrorResult(ex.Message, 400));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error interno del servidor", 500));
        }
    }

    [HttpGet("{id}/image")]
    public async Task<IActionResult> GetIncidentImage(Guid id)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var isAdmin = User.IsInRole("Admin");
            var result = await _incidentService.GetIncidentImageAsync(id, userId, isAdmin);
            
            if (result == null)
            {
                return NotFound();
            }

            return File(result.Value.fileBytes, result.Value.mimeType);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error interno del servidor", 500));
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CondoFlow.Application.Interfaces.Services;
using CondoFlow.Application.Common.DTOs.Incident;
using CondoFlow.Domain.Enums;
using CondoFlow.WebApi.DTOs;
using System.Security.Claims;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IncidentsController : BaseApiController
{
    private readonly IIncidentService _incidentService;

    public IncidentsController(IIncidentService incidentService)
    {
        _incidentService = incidentService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateIncident([FromForm] CreateIncidentRequest request, IFormFile? image = null)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return UnauthorizedError("Usuario no autenticado");

        string? imageData = null;
        if (image != null)
        {
            // Validar imagen
            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
            if (!allowedTypes.Contains(image.ContentType.ToLower()))
                return BadRequestError("Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG y GIF.");
            
            if (image.Length > 5 * 1024 * 1024) // 5MB
                return BadRequestError("La imagen no puede ser mayor a 5MB.");
            
            // Convertir imagen a base64
            using var memoryStream = new MemoryStream();
            await image.CopyToAsync(memoryStream);
            var fileBytes = memoryStream.ToArray();
            var base64String = Convert.ToBase64String(fileBytes);
            imageData = $"data:{image.ContentType};base64,{base64String}";
        }

        var dto = new CreateIncidentDto
        {
            Title = request.Title,
            Description = request.Description,
            Category = request.Category,
            Priority = request.Priority
        };

        var incident = await _incidentService.CreateIncidentAsync(dto, userId, imageData);
        return Created(incident, "Incidencia reportada exitosamente");
    }

    [HttpGet("my-incidents")]
    public async Task<IActionResult> GetMyIncidents()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return UnauthorizedError("Usuario no autenticado");

        var incidents = await _incidentService.GetMyIncidentsAsync(userId);
        return Success(incidents, "Incidencias obtenidas exitosamente");
    }

    [HttpGet]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> GetAllIncidents()
    {
        var incidents = await _incidentService.GetAllIncidentsAsync();
        return Success(incidents, "Incidencias obtenidas exitosamente");
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> UpdateIncidentStatus(Guid id, [FromBody] UpdateIncidentStatusRequest request)
    {
        var dto = new UpdateIncidentStatusDto
        {
            Status = request.Status,
            AdminComment = request.AdminComment
        };

        await _incidentService.UpdateIncidentStatusAsync(id, dto);
        return Success<object>(null!, "Estado de incidencia actualizado exitosamente");
    }

    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> CancelIncident(Guid id, [FromBody] CancelIncidentRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return UnauthorizedError("Usuario no autenticado");

        var dto = new CancelIncidentDto
        {
            Comment = request.Comment
        };

        await _incidentService.CancelIncidentAsync(id, userId, dto);
        return Success<object>(null!, "Incidencia cancelada exitosamente");
    }

    [HttpGet("{id}/image")]
    public async Task<IActionResult> GetIncidentImage(Guid id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return UnauthorizedError("Usuario no autenticado");

        var isAdmin = User.IsInRole(UserRoles.Admin);
        var dto = new GetIncidentImageDto
        {
            IncidentId = id,
            UserId = userId,
            IsAdmin = isAdmin
        };

        var result = await _incidentService.GetIncidentImageAsync(dto);
        if (result == null)
            return NotFoundError("Imagen no encontrada");

        return File(result.Value.fileBytes, result.Value.mimeType);
    }
}

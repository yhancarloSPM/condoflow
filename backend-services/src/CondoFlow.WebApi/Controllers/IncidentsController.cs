using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using CondoFlow.Infrastructure.Data;
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
    private readonly ApplicationDbContext _context;

    public IncidentsController(ApplicationDbContext context)
    {
        _context = context;
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

            // Buscar el usuario
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userIdClaim);
            if (user == null)
            {
                return BadRequest(ApiResponse.ErrorResult("Usuario no encontrado", 400));
            }

            string? imageUrl = null;
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
                
                // Guardar imagen
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "incidents");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }
                
                var fileName = $"{Guid.NewGuid()}_{image.FileName}";
                var filePath = Path.Combine(uploadsFolder, fileName);
                
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await image.CopyToAsync(stream);
                }
                
                imageUrl = $"/incidents/{fileName}";
            }

            var incident = new Incident(
                userId, // Usar directamente el userId
                request.Title,
                request.Description,
                request.Category,
                request.Priority,
                imageUrl
            );

            _context.Incidents.Add(incident);
            await _context.SaveChangesAsync();

            // Enviar notificación al admin
            var notification = new Notification(
                "Nueva Incidencia Reportada",
                $"Se ha reportado una nueva incidencia: {incident.Title}",
                "IncidentReported",
                "Admin",
                null,
                incident.Id.ToString()
            );

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

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

            // Buscar el usuario
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userIdClaim);
            if (user == null)
            {
                return BadRequest(ApiResponse.ErrorResult("Usuario no encontrado", 400));
            }

            var incidents = await _context.Incidents
                .Where(i => i.OwnerId == userId)
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => new {
                    id = i.Id,
                    title = i.Title,
                    description = i.Description,
                    category = i.Category,
                    priority = i.Priority,
                    status = i.Status,
                    adminComment = i.AdminComment,
                    imageUrl = i.ImageUrl,
                    createdAt = i.CreatedAt,
                    updatedAt = i.UpdatedAt
                })
                .ToListAsync();

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
            var incidents = await _context.Incidents
                .Join(_context.Users, i => i.OwnerId.ToString(), u => u.Id, (i, u) => new {
                    id = i.Id,
                    title = i.Title,
                    description = i.Description,
                    category = i.Category,
                    priority = i.Priority,
                    status = i.Status,
                    adminComment = i.AdminComment,
                    ownerName = $"{u.FirstName} {u.LastName}",
                    apartment = $"{u.Block}-{u.Apartment}",
                    createdAt = i.CreatedAt,
                    updatedAt = i.UpdatedAt
                })
                .OrderByDescending(i => i.createdAt)
                .ToListAsync();

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
            var incident = await _context.Incidents.FindAsync(id);
            if (incident == null)
            {
                return NotFound(ApiResponse.ErrorResult("Incidencia no encontrada", 404));
            }

            incident.ChangeStatus(request.Status, request.AdminComment);
            await _context.SaveChangesAsync();

            // Enviar notificación al propietario
            var owner = await _context.Users.FindAsync(incident.OwnerId.ToString());
            if (owner != null)
            {
                var statusMessage = request.Status switch
                {
                    "in_progress" => "Tu incidencia está siendo procesada",
                    "resolved" => "Tu incidencia ha sido resuelta",
                    "cancelled" => $"Tu incidencia ha sido cancelada. {request.AdminComment}",
                    _ => "El estado de tu incidencia ha cambiado"
                };

                var notification = new Notification(
                    "Estado de Incidencia Actualizado",
                    statusMessage,
                    "IncidentStatusUpdate",
                    "Owner",
                    owner.Id,
                    incident.Id.ToString()
                );

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
            }

            return Ok(ApiResponse<object>.SuccessResult(null, "Estado de incidencia actualizado exitosamente", 200));
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

            var incident = await _context.Incidents.FindAsync(id);
            if (incident == null)
            {
                return NotFound(ApiResponse.ErrorResult("Incidencia no encontrada", 404));
            }

            // Verificar que el owner sea el propietario de la incidencia
            if (incident.OwnerId != userId)
            {
                return Forbid();
            }

            // Solo se pueden cancelar incidencias reportadas
            if (incident.Status != "reported")
            {
                return BadRequest(ApiResponse.ErrorResult("Solo se pueden cancelar incidencias reportadas", 400));
            }

            incident.ChangeStatus("cancelled", request.Comment);
            await _context.SaveChangesAsync();

            // Enviar notificación al admin
            var notification = new Notification(
                "Incidencia Cancelada por Propietario",
                $"El propietario ha cancelado la incidencia: {incident.Title}. Motivo: {request.Comment}",
                "IncidentCancelledByOwner",
                "Admin",
                null,
                incident.Id.ToString()
            );

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.SuccessResult(null, "Incidencia cancelada exitosamente", 200));
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

            var incident = await _context.Incidents.FindAsync(id);
            if (incident == null)
            {
                return NotFound();
            }

            // Verificar que el usuario sea el propietario de la incidencia o sea admin
            var isAdmin = User.IsInRole("Admin");
            if (!isAdmin && incident.OwnerId != userId)
            {
                return Forbid();
            }

            if (string.IsNullOrEmpty(incident.ImageUrl))
            {
                return NotFound();
            }

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", incident.ImageUrl.TrimStart('/'));
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound();
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            var contentType = GetContentType(filePath);
            
            return File(fileBytes, contentType);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error interno del servidor", 500));
        }
    }

    private string GetContentType(string filePath)
    {
        var extension = Path.GetExtension(filePath).ToLowerInvariant();
        return extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            _ => "application/octet-stream"
        };
    }
}

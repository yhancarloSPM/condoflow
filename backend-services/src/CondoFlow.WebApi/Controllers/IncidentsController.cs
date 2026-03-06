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

            var incident = new Incident(
                userId, // Usar directamente el userId
                request.Title,
                request.Description,
                request.Category,
                request.Priority,
                imageData
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
                    imageUrl = i.ImageData,
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
                .Join(_context.Users, i => i.OwnerId.ToString(), u => u.Id, (i, u) => new { i, u })
                .GroupJoin(_context.Apartments.Include(a => a.Block), x => x.u.ApartmentId, a => (int?)a.Id, (x, apartments) => new { x.i, x.u, apartment = apartments.FirstOrDefault() })
                .Select(x => new {
                    id = x.i.Id,
                    title = x.i.Title,
                    description = x.i.Description,
                    category = x.i.Category,
                    priority = x.i.Priority,
                    status = x.i.Status,
                    adminComment = x.i.AdminComment,
                    ownerName = $"{x.u.FirstName} {x.u.LastName}",
                    apartment = x.apartment != null ? $"{x.apartment.Block.Name}-{x.apartment.Number}" : "",
                    createdAt = x.i.CreatedAt,
                    updatedAt = x.i.UpdatedAt
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

            if (string.IsNullOrEmpty(incident.ImageData))
            {
                return NotFound();
            }

            // Si ImageData es base64, extraerlo y devolverlo
            if (incident.ImageData?.StartsWith("data:") == true)
            {
                var base64Data = incident.ImageData.Split(',')[1];
                var mimeType = incident.ImageData.Split(';')[0].Split(':')[1];
                var fileBytes = Convert.FromBase64String(base64Data);
                
                return File(fileBytes, mimeType);
            }

            return NotFound();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse.ErrorResult("Error interno del servidor", 500));
        }
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CondoFlow.Infrastructure.Data;
using CondoFlow.Domain.Entities;
using CondoFlow.Application.Common.Models;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public NotificationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetNotifications()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? 
                     User.FindFirst("sub")?.Value ?? 
                     User.FindFirst("id")?.Value;
        
        var userRoles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();
        if (!userRoles.Any())
        {
            userRoles = User.FindAll("role").Select(c => c.Value).ToList();
        }

        var query = _context.Notifications.AsQueryable();
        
        // Filtrar notificaciones no eliminadas
        query = query.Where(n => !n.IsDeleted);
        
        if (userRoles.Contains("Admin"))
        {
            query = query.Where(n => n.TargetRole == "Admin");
        }
        else if (!string.IsNullOrEmpty(userId))
        {
            query = query.Where(n => n.UserId == userId);
        }
        
        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(n => new
            {
                id = n.Id.ToString(),
                title = n.Title,
                message = n.Message,
                type = n.Type,
                createdAt = n.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss"),
                isRead = n.IsRead
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.SuccessResult(notifications, "Notificaciones obtenidas exitosamente", 200));
    }

    [HttpPut("{id}/mark-read")]
    public async Task<ActionResult> MarkAsRead(Guid id)
    {
        var notification = await _context.Notifications.FindAsync(id);
        if (notification == null)
        {
            return NotFound();
        }

        notification.MarkAsRead();
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.SuccessResult(null, "Notificación marcada como leída", 200));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteNotification(Guid id)
    {
        var notification = await _context.Notifications.FindAsync(id);
        if (notification == null)
        {
            return NotFound(ApiResponse<object>.ErrorResult("Notificación no encontrada", 404));
        }

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? 
                     User.FindFirst("sub")?.Value ?? 
                     User.FindFirst("id")?.Value;
        
        var userRoles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();
        if (!userRoles.Any())
        {
            userRoles = User.FindAll("role").Select(c => c.Value).ToList();
        }

        // Verificar que el usuario tenga permiso para eliminar esta notificación
        if (!userRoles.Contains("Admin") && notification.UserId != userId)
        {
            return Forbid();
        }

        // Borrado lógico
        notification.MarkAsDeleted();
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.SuccessResult(null, "Notificación eliminada exitosamente", 200));
    }
}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Domain.Enums;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : BaseApiController
{
    private readonly INotificationRepository _notificationRepository;

    public NotificationsController(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? 
                     User.FindFirst("sub")?.Value ?? 
                     User.FindFirst("id")?.Value;
        
        var userRoles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();
        if (!userRoles.Any())
        {
            userRoles = User.FindAll("role").Select(c => c.Value).ToList();
        }

        var isAdmin = userRoles.Contains(UserRoles.Admin);
        var notifications = await _notificationRepository.GetUserNotificationsAsync(userId, isAdmin);

        return Success(notifications, "Notificaciones obtenidas exitosamente");
    }

    [HttpPut("{id}/mark-read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        try
        {
            await _notificationRepository.MarkAsReadAsync(id);
            return Success<object>(null, "Notificación marcada como leída");
        }
        catch (KeyNotFoundException)
        {
            return NotFoundError("Notificación no encontrada");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNotification(Guid id)
    {
        try
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? 
                         User.FindFirst("sub")?.Value ?? 
                         User.FindFirst("id")?.Value;
            
            var userRoles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();
            if (!userRoles.Any())
            {
                userRoles = User.FindAll("role").Select(c => c.Value).ToList();
            }

            var isAdmin = userRoles.Contains(UserRoles.Admin);
            await _notificationRepository.DeleteNotificationAsync(id, userId, isAdmin);

            return Success<object>(null, "Notificación eliminada exitosamente");
        }
        catch (KeyNotFoundException)
        {
            return NotFoundError("Notificación no encontrada");
        }
        catch (UnauthorizedAccessException)
        {
            return ForbiddenError("No tienes permiso para eliminar esta notificación");
        }
    }
}

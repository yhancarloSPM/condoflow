using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CondoFlow.Application.Interfaces.Repositories;
using CondoFlow.Application.Common.Models;

namespace CondoFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationRepository _notificationRepository;

    public NotificationsController(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
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

        var isAdmin = userRoles.Contains("Admin");
        var notifications = await _notificationRepository.GetUserNotificationsAsync(userId, isAdmin);

        return Ok(ApiResponse<object>.SuccessResult(notifications, "Notificaciones obtenidas exitosamente", 200));
    }

    [HttpPut("{id}/mark-read")]
    public async Task<ActionResult> MarkAsRead(Guid id)
    {
        try
        {
            await _notificationRepository.MarkAsReadAsync(id);
            return Ok(ApiResponse<object>.SuccessResult(null, "Notificación marcada como leída", 200));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteNotification(Guid id)
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

            var isAdmin = userRoles.Contains("Admin");
            await _notificationRepository.DeleteNotificationAsync(id, userId, isAdmin);

            return Ok(ApiResponse<object>.SuccessResult(null, "Notificación eliminada exitosamente", 200));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<object>.ErrorResult("Notificación no encontrada", 404));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
}

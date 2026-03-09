using CondoFlow.Domain.Entities;
using CondoFlow.Domain.Enums;
using CondoFlow.Infrastructure.Data;
using CondoFlow.Application.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly ApplicationDbContext _context;

    public NotificationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<object>> GetUserNotificationsAsync(string? userId, bool isAdmin)
    {
        var query = _context.Notifications.AsQueryable();
        
        // Filtrar notificaciones no eliminadas
        query = query.Where(n => !n.IsDeleted);
        
        if (isAdmin)
        {
            query = query.Where(n => n.TargetRole == UserRoles.Admin);
        }
        else if (!string.IsNullOrEmpty(userId))
        {
            query = query.Where(n => n.UserId == userId);
        }
        
        return await query
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
    }

    public async Task<int> GetUnreadCountAsync(string userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead && !n.IsDeleted)
            .CountAsync();
    }

    public async Task MarkAsReadAsync(Guid notificationId)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);
        
        if (notification == null)
            throw new KeyNotFoundException("Notificación no encontrada");

        notification.MarkAsRead();
        await _context.SaveChangesAsync();
    }

    public async Task MarkAllAsReadAsync(string userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead && !n.IsDeleted)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.MarkAsRead();
        }

        await _context.SaveChangesAsync();
    }

    public async Task DeleteNotificationAsync(Guid notificationId, string? userId, bool isAdmin)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);
        
        if (notification == null)
            throw new KeyNotFoundException("Notificación no encontrada");

        // Verificar permisos
        if (!isAdmin && notification.UserId != userId)
            throw new UnauthorizedAccessException("No tienes permiso para eliminar esta notificación");

        notification.MarkAsDeleted();
        await _context.SaveChangesAsync();
    }

    public async Task AddAsync(Notification notification)
    {
        await _context.Notifications.AddAsync(notification);
        await _context.SaveChangesAsync();
    }
}

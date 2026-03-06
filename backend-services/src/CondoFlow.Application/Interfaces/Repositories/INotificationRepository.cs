using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Interfaces.Repositories;

public interface INotificationRepository
{
    Task<IEnumerable<object>> GetUserNotificationsAsync(string? userId, bool isAdmin);
    Task<int> GetUnreadCountAsync(string userId);
    Task MarkAsReadAsync(Guid notificationId);
    Task MarkAllAsReadAsync(string userId);
    Task DeleteNotificationAsync(Guid notificationId, string? userId, bool isAdmin);
    Task AddAsync(Notification notification);
}

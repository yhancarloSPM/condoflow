using CondoFlow.Domain.Entities;

namespace CondoFlow.Application.Common.Services;

public interface INotificationService
{
    Task SendUserRegistrationNotificationAsync(string firstName, string lastName, string block, string apartment);
    Task SendPaymentReceivedNotificationAsync(Guid paymentId, string ownerName, decimal amount);
    Task SendPaymentStatusNotificationAsync(string userId, Guid paymentId, string status, string ownerName, decimal amount, string? rejectionReason = null);
    Task SendUserStatusNotificationAsync(string userId, string status, string firstName, string lastName);
    Task SendAnnouncementNotificationAsync(Guid announcementId, string title, bool isUrgent);
    Task SendAnnouncementDeletionNotificationAsync(string announcementTitle);
    Task SendDebtReminderAsync(Guid debtId, string userId, string concept, decimal amount, DateTime dueDate);
    Task SendDebtOverdueAsync(Guid debtId, string userId, string concept, decimal amount, DateTime dueDate);
    Task<List<Notification>> GetUserNotificationsAsync(string userId);
    Task<List<Notification>> GetAdminNotificationsAsync();
    Task MarkNotificationAsReadAsync(Guid notificationId);
    Task CreateNotificationAsync(string userId, string title, string message, string type, string? relatedEntityId = null);
    Task SendAdminNotificationAsync(string title, string message, string type, string? relatedEntityId = null);
}
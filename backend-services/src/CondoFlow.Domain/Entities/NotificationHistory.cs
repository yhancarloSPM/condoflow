using CondoFlow.Domain.Common;

namespace CondoFlow.Domain.Entities;

public class NotificationHistory : BaseEntity
{
    public Guid DebtId { get; private set; }
    public string NotificationType { get; private set; } = string.Empty;
    public DateTime SentDate { get; private set; }
    public string UserId { get; private set; } = string.Empty;

    private NotificationHistory() { } // Para EF Core

    public NotificationHistory(Guid debtId, string notificationType, string userId)
    {
        DebtId = debtId;
        NotificationType = notificationType;
        UserId = userId;
        SentDate = DateTime.Now;
    }
}
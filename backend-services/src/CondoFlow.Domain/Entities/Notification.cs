using CondoFlow.Domain.Common;

namespace CondoFlow.Domain.Entities;

public class Notification : BaseEntity
{
    public string Title { get; private set; }
    public string Message { get; private set; }
    public string Type { get; private set; } // UserRegistration, PaymentReceived, PaymentApproved, PaymentRejected
    public string? UserId { get; private set; } // Para notificaciones específicas de usuario
    public string TargetRole { get; private set; } // Admin o User
    public bool IsRead { get; private set; }
    public bool IsDeleted { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public string? RelatedEntityId { get; private set; } // ID del pago, usuario, etc.

    private Notification() { } // EF Constructor

    public Notification(string title, string message, string type, string targetRole, string? userId = null, string? relatedEntityId = null)
    {
        Title = title;
        Message = message;
        Type = type;
        TargetRole = targetRole;
        UserId = userId;
        RelatedEntityId = relatedEntityId;
        IsRead = false;
        IsDeleted = false;
        CreatedAt = DateTime.UtcNow;
    }

    public void MarkAsRead()
    {
        IsRead = true;
    }

    public void MarkAsDeleted()
    {
        IsDeleted = true;
    }
}
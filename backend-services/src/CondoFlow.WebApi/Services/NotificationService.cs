using CondoFlow.Application.Common.Services;
using CondoFlow.Domain.Entities;
using CondoFlow.Infrastructure.Data;
using CondoFlow.WebApi.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.WebApi.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    public async Task SendUserRegistrationNotificationAsync(string firstName, string lastName, string block, string apartment)
    {
        var notification = new Notification(
            "Nuevo registro de usuario",
            $"{firstName} {lastName} se ha registrado para el apartamento {apartment}-{block}",
            "UserRegistration",
            "Admin"
        );

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        var notificationData = new
        {
            id = notification.Id,
            title = notification.Title,
            message = notification.Message,
            type = notification.Type,
            createdAt = notification.CreatedAt
        };
        
        await _hubContext.Clients.Group("Admins").SendAsync("NewNotification", notificationData);
    }

    public async Task SendPaymentReceivedNotificationAsync(Guid paymentId, string ownerName, decimal amount)
    {
        var notification = new Notification(
            "Nuevo pago recibido",
            $"{ownerName} ha enviado un pago de ${amount:N2}",
            "PaymentReceived",
            "Admin",
            relatedEntityId: paymentId.ToString()
        );

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        await _hubContext.Clients.Group("Admins").SendAsync("NewNotification", new
        {
            id = notification.Id,
            title = notification.Title,
            message = notification.Message,
            type = notification.Type,
            createdAt = notification.CreatedAt
        });
    }

    public async Task SendPaymentStatusNotificationAsync(string userId, Guid paymentId, string status, string ownerName, decimal amount, string? rejectionReason = null)
    {
        var title = status == "Approved" ? "Pago aprobado" : "Pago rechazado";
        var message = status == "Approved" 
            ? $"Tu pago de ${amount:N2} ha sido aprobado"
            : $"Tu pago de ${amount:N2} ha sido rechazado";
            
        if (status == "Rejected" && !string.IsNullOrEmpty(rejectionReason))
        {
            message += $"\nRazón: {rejectionReason}";
        }

        var notification = new Notification(
            title,
            message,
            status == "Approved" ? "PaymentApproved" : "PaymentRejected",
            "User",
            userId,
            paymentId.ToString()
        );

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        await _hubContext.Clients.Group($"User_{userId}").SendAsync("NewNotification", new
        {
            id = notification.Id,
            title = notification.Title,
            message = notification.Message,
            type = notification.Type,
            createdAt = notification.CreatedAt
        });
    }

    public async Task SendUserStatusNotificationAsync(string userId, string status, string firstName, string lastName)
    {
        var title = status == "Approved" ? "Registro aprobado" : "Registro rechazado";
        var message = status == "Approved" 
            ? $"¡Felicidades {firstName}! Tu registro ha sido aprobado"
            : $"Lo sentimos {firstName}, tu registro ha sido rechazado";

        var notification = new Notification(
            title,
            message,
            status == "Approved" ? "UserApproved" : "UserRejected",
            "User",
            userId
        );

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        var notificationData = new
        {
            id = notification.Id,
            title = notification.Title,
            message = notification.Message,
            type = notification.Type,
            createdAt = notification.CreatedAt
        };
        
        await _hubContext.Clients.Group($"User_{userId}").SendAsync("NewNotification", notificationData);
    }

    public async Task<List<Notification>> GetUserNotificationsAsync(string userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync();
    }

    public async Task<List<Notification>> GetAdminNotificationsAsync()
    {
        return await _context.Notifications
            .Where(n => n.UserId == null)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync();
    }

    public async Task SendAnnouncementNotificationAsync(Guid announcementId, string title, bool isUrgent)
    {
        var notificationTitle = isUrgent ? "Anuncio Urgente" : "Nuevo Anuncio";
        var message = isUrgent ? $"URGENTE: {title}" : $"Nuevo anuncio: {title}";
        
        // Obtener todos los usuarios aprobados que tengan habilitadas las notificaciones de anuncios
        var approvedUsers = await _context.Users
            .Where(u => u.IsApproved)
            .Select(u => u.Id)
            .ToListAsync();
        
        // Crear notificación para cada usuario que tenga habilitadas las notificaciones
        foreach (var userId in approvedUsers)
        {
            // Verificar preferencias de notificación (por ahora usar localStorage del frontend)
            // En el futuro esto se puede mover a la base de datos
            
            var notification = new Notification(
                notificationTitle,
                message,
                isUrgent ? "AnnouncementUrgent" : "AnnouncementNormal",
                "User",
                userId,
                announcementId.ToString()
            );
            
            _context.Notifications.Add(notification);
            
            // Enviar notificación en tiempo real con información de preferencias
            await _hubContext.Clients.Group($"User_{userId}").SendAsync("NewNotification", new
            {
                id = notification.Id,
                title = notification.Title,
                message = notification.Message,
                type = notification.Type,
                createdAt = notification.CreatedAt,
                category = "announcements" // Agregar categoría para filtrar en el frontend
            });
        }
        
        await _context.SaveChangesAsync();
    }

    public async Task SendAnnouncementDeletionNotificationAsync(string announcementTitle)
    {
        // Obtener todos los usuarios aprobados
        var approvedUsers = await _context.Users
            .Where(u => u.IsApproved)
            .Select(u => u.Id)
            .ToListAsync();
        
        // Crear notificación para cada usuario
        foreach (var userId in approvedUsers)
        {
            var notification = new Notification(
                "Anuncio eliminado",
                $"El anuncio '{announcementTitle}' ha sido eliminado por la administración",
                "AnnouncementDeleted",
                "User",
                userId
            );
            
            _context.Notifications.Add(notification);
            
            // Enviar notificación en tiempo real con categoría
            await _hubContext.Clients.Group($"User_{userId}").SendAsync("NewNotification", new
            {
                id = notification.Id,
                title = notification.Title,
                message = notification.Message,
                type = notification.Type,
                createdAt = notification.CreatedAt,
                category = "announcements" // Agregar categoría para filtrar en el frontend
            });
        }
        
        await _context.SaveChangesAsync();
    }

    public async Task SendDebtReminderAsync(Guid debtId, string userId, string concept, decimal amount, DateTime dueDate)
    {
        // Verificar si ya se envió este recordatorio
        var alreadySent = await _context.NotificationHistories
            .AnyAsync(nh => nh.DebtId == debtId && nh.NotificationType == "DebtReminder");
            
        if (alreadySent) return;
        
        var notification = new Notification(
            "Recordatorio de Pago",
            $"Tu deuda de {concept} vence el {dueDate:dd/MM/yyyy}. Monto: ${amount:N2}",
            "DebtReminder",
            "User",
            userId,
            debtId.ToString()
        );
        
        _context.Notifications.Add(notification);
        
        // Registrar en historial
        var history = new NotificationHistory(debtId, "DebtReminder", userId);
        _context.NotificationHistories.Add(history);
        
        await _context.SaveChangesAsync();
        
        // Enviar notificación en tiempo real
        await _hubContext.Clients.Group($"User_{userId}").SendAsync("NewNotification", new
        {
            id = notification.Id,
            title = notification.Title,
            message = notification.Message,
            type = notification.Type,
            createdAt = notification.CreatedAt,
            category = "reminders"
        });
    }

    public async Task SendDebtOverdueAsync(Guid debtId, string userId, string concept, decimal amount, DateTime dueDate)
    {
        // Verificar si ya se envió este aviso de mora
        var alreadySent = await _context.NotificationHistories
            .AnyAsync(nh => nh.DebtId == debtId && nh.NotificationType == "DebtOverdue");
            
        if (alreadySent) return;
        
        var notification = new Notification(
            "Pago Vencido",
            $"Tu deuda de {concept} está vencida desde el {dueDate:dd/MM/yyyy}. Monto: ${amount:N2}",
            "DebtOverdue",
            "User",
            userId,
            debtId.ToString()
        );
        
        _context.Notifications.Add(notification);
        
        // Registrar en historial
        var history = new NotificationHistory(debtId, "DebtOverdue", userId);
        _context.NotificationHistories.Add(history);
        
        await _context.SaveChangesAsync();
        
        // Enviar notificación en tiempo real
        await _hubContext.Clients.Group($"User_{userId}").SendAsync("NewNotification", new
        {
            id = notification.Id,
            title = notification.Title,
            message = notification.Message,
            type = notification.Type,
            createdAt = notification.CreatedAt,
            category = "reminders"
        });
    }

    public async Task MarkNotificationAsReadAsync(Guid notificationId)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);
        if (notification != null)
        {
            notification.MarkAsRead();
            await _context.SaveChangesAsync();
        }
    }

    public async Task CreateNotificationAsync(string userId, string title, string message, string type, string? relatedEntityId = null)
    {
        var notification = new Notification(
            title,
            message,
            type,
            "User",
            userId,
            relatedEntityId
        );

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        await _hubContext.Clients.Group($"User_{userId}").SendAsync("NewNotification", new
        {
            id = notification.Id,
            title = notification.Title,
            message = notification.Message,
            type = notification.Type,
            createdAt = notification.CreatedAt
        });
    }
    
    public async Task SendAdminNotificationAsync(string title, string message, string type, string? relatedEntityId = null)
    {
        var notification = new Notification(
            title,
            message,
            type,
            "Admin",
            relatedEntityId: relatedEntityId
        );

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        await _hubContext.Clients.Group("Admins").SendAsync("NewNotification", new
        {
            id = notification.Id,
            title = notification.Title,
            message = notification.Message,
            type = notification.Type,
            createdAt = notification.CreatedAt
        });
    }

    public async Task NotifyNewPollAsync(int pollId, string pollTitle)
    {
        // Obtener todos los usuarios aprobados (propietarios)
        var approvedUsers = await _context.Users
            .Where(u => u.IsApproved)
            .Select(u => u.Id)
            .ToListAsync();
        
        // Crear notificación para cada usuario
        foreach (var userId in approvedUsers)
        {
            var notification = new Notification(
                "Nueva Encuesta",
                $"Nueva encuesta disponible: {pollTitle}",
                "NewPoll",
                "User",
                userId,
                pollId.ToString()
            );
            
            _context.Notifications.Add(notification);
            
            // Enviar notificación en tiempo real con categoría
            await _hubContext.Clients.Group($"User_{userId}").SendAsync("NewNotification", new
            {
                id = notification.Id,
                title = notification.Title,
                message = notification.Message,
                type = notification.Type,
                createdAt = notification.CreatedAt,
                category = "polls" // Agregar categoría para filtrar en el frontend
            });
        }
        
        await _context.SaveChangesAsync();
    }
}
using CondoFlow.Application.Common.Services;
using CondoFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CondoFlow.Infrastructure.Services;

public class DebtReminderService : IDebtReminderService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<DebtReminderService> _logger;

    public DebtReminderService(
        ApplicationDbContext context,
        INotificationService notificationService,
        ILogger<DebtReminderService> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task ProcessDebtRemindersAsync()
    {
        _logger.LogInformation("Iniciando procesamiento de recordatorios de deudas...");

        try
        {
            await ProcessUpcomingDebts();
            await ProcessOverdueDebts();
            
            _logger.LogInformation("Procesamiento de recordatorios completado exitosamente");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando recordatorios de deudas");
        }
    }

    private async Task ProcessUpcomingDebts()
    {
        // Buscar deudas que vencen en 3 días
        var reminderDate = DateTime.Now.AddDays(3).Date;
        
        var upcomingDebts = await _context.Debts
            .Where(d => d.Status == "Pending" && d.DueDate.Date == reminderDate)
            .ToListAsync();

        foreach (var debt in upcomingDebts)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.OwnerId == debt.OwnerId && u.IsApproved);
            if (user != null)
            {
                await _notificationService.SendDebtReminderAsync(
                    debt.Id,
                    user.Id,
                    debt.Concept,
                    debt.Amount.Amount,
                    debt.DueDate
                );
            }
        }

        _logger.LogInformation($"Procesadas {upcomingDebts.Count} deudas próximas a vencer");
    }

    private async Task ProcessOverdueDebts()
    {
        // Buscar deudas vencidas hace 1 día
        var overdueDate = DateTime.Now.AddDays(-1).Date;
        
        var overdueDebts = await _context.Debts
            .Where(d => d.Status == "Pending" && d.DueDate.Date == overdueDate)
            .ToListAsync();

        foreach (var debt in overdueDebts)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.OwnerId == debt.OwnerId && u.IsApproved);
            if (user != null)
            {
                await _notificationService.SendDebtOverdueAsync(
                    debt.Id,
                    user.Id,
                    debt.Concept,
                    debt.Amount.Amount,
                    debt.DueDate
                );
            }
        }

        _logger.LogInformation($"Procesadas {overdueDebts.Count} deudas vencidas");
    }
}
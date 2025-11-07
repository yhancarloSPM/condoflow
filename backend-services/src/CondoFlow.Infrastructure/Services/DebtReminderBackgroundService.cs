using CondoFlow.Application.Common.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CondoFlow.Infrastructure.Services;

public class DebtReminderBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DebtReminderBackgroundService> _logger;

    public DebtReminderBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<DebtReminderBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.Now;
                var nextRun = now.Date.AddDays(1).AddHours(8); // Ejecutar todos los días a las 8:00 AM
                
                if (nextRun <= now)
                {
                    nextRun = nextRun.AddDays(1);
                }
                
                var delay = nextRun - now;
                
                _logger.LogInformation("Próximo procesamiento de recordatorios programado para: {NextRun}", nextRun);
                
                await Task.Delay(delay, stoppingToken);
                
                if (!stoppingToken.IsCancellationRequested)
                {
                    await ProcessDebtReminders();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en el servicio de recordatorios de deudas");
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }

    private async Task ProcessDebtReminders()
    {
        using var scope = _serviceProvider.CreateScope();
        var debtReminderService = scope.ServiceProvider.GetRequiredService<IDebtReminderService>();
        
        await debtReminderService.ProcessDebtRemindersAsync();
    }
}
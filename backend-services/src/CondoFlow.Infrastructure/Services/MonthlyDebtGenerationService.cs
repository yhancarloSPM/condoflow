using CondoFlow.Domain.Entities;
using CondoFlow.Domain.Enums;
using CondoFlow.Domain.Helpers;
using CondoFlow.Domain.ValueObjects;
using CondoFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CondoFlow.Infrastructure.Services;

public class MonthlyDebtGenerationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MonthlyDebtGenerationService> _logger;

    public MonthlyDebtGenerationService(
        IServiceProvider serviceProvider,
        ILogger<MonthlyDebtGenerationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Servicio de generación anual de deudas iniciado");
        
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.Now;
                var nextJanuary1st = new DateTime(now.Year + 1, 1, 1, 0, 1, 0);
                
                // Si estamos en el 1 de enero y es temprano (primeros 5 minutos), ejecutar inmediatamente
                if (now.Month == 1 && now.Day == 1 && now.Hour == 0 && now.Minute < 5)
                {
                    _logger.LogInformation("Ejecutando generación de deudas para el año {Year}", now.Year);
                    await GenerateDebtsForYear(now.Year);
                    
                    // Esperar hasta el próximo año
                    nextJanuary1st = new DateTime(now.Year + 1, 1, 1, 0, 1, 0);
                }
                
                var delay = nextJanuary1st - now;
                _logger.LogInformation("Próxima generación de deudas programada para: {Date}", nextJanuary1st);
                
                await Task.Delay(delay, stoppingToken);
                
                // Generar deudas para el nuevo año
                var yearToGenerate = nextJanuary1st.Year;
                _logger.LogInformation("Generando deudas para el año {Year}", yearToGenerate);
                await GenerateDebtsForYear(yearToGenerate);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en el servicio de generación de deudas anuales");
                // Esperar 1 hora antes de reintentar en caso de error
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }

    public async Task GenerateDebtsForYear(int year, int? specificMonth = null)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        _logger.LogInformation("Iniciando generación de deudas para el año {Year}", year);

        try
        {
            var apartments = await context.Apartments
                .Where(a => a.IsActive && a.OwnerId != null)
                .ToListAsync();

            _logger.LogInformation("Apartamentos encontrados: {Count}", apartments.Count);

            var debtsCreated = 0;
            var startMonth = specificMonth ?? 1;
            var endMonth = specificMonth ?? 12;

            for (int month = startMonth; month <= endMonth; month++)
            {
                foreach (var apartment in apartments)
                {
                    var existingDebt = await context.Debts
                        .FirstOrDefaultAsync(d => d.OwnerId == apartment.OwnerId && 
                                                 d.Month == month && 
                                                 d.Year == year &&
                                                 d.Concept.Contains("Mantenimiento"));

                    if (existingDebt == null)
                    {
                        var maintenanceConcept = await context.PaymentConcepts
                            .FirstOrDefaultAsync(c => c.Code == PaymentConceptCodes.Maintenance && c.IsActive);
                        
                        if (maintenanceConcept == null)
                        {
                            _logger.LogError("Concepto de mantenimiento no encontrado");
                            continue;
                        }
                        
                        // Usar el monto del apartamento en lugar del concepto
                        var amount = apartment.MonthlyMaintenanceAmount;
                        
                        var debt = new Debt();
                        debt.Id = Guid.NewGuid();
                        debt.OwnerId = apartment.OwnerId!.Value;
                        debt.Amount = new Money(amount, "DOP");
                        debt.PaidAmount = new Money(0, "DOP");
                        debt.Month = month;
                        debt.Year = year;
                        debt.DueDate = new DateTime(year, month, DateTime.DaysInMonth(year, month));
                        debt.Concept = $"Mantenimiento {DateHelper.GetMonthName(month)} {year}";
                        debt.Status = StatusPayments.Pending;
                        debt.CreatedAt = DateTime.UtcNow;

                        context.Debts.Add(debt);
                        debtsCreated++;
                        _logger.LogInformation("Creando deuda: Apartamento {Apt}, Mes {Month}, Año {Year}, Monto {Amount}", apartment.Number, month, year, amount);
                    }
                    else
                    {
                        _logger.LogInformation("Deuda ya existe: Apartamento {Apt}, Mes {Month}, Año {Year}, DebtId {DebtId}", apartment.Number, month, year, existingDebt.Id);
                    }
                }
            }

            if (debtsCreated > 0)
            {
                await context.SaveChangesAsync();
                _logger.LogInformation("Generación completada: {Count} deudas creadas para el año {Year}", debtsCreated, year);
            }
            else
            {
                _logger.LogInformation("No se crearon nuevas deudas - ya existen para el año {Year}", year);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generando deudas para el año {Year}", year);
            throw;
        }
    }

    private async Task GenerateMonthlyDebts()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var currentMonth = DateTime.Now.Month;
        var currentYear = DateTime.Now.Year;
        
        _logger.LogInformation("Iniciando generación de deudas para {Month}/{Year}", currentMonth, currentYear);

        try
        {
            var apartments = await context.Apartments
                .Where(a => a.IsActive && a.OwnerId != null)
                .ToListAsync();

            var debtsCreated = 0;

            foreach (var apartment in apartments)
            {
                var existingDebt = await context.Debts
                    .FirstOrDefaultAsync(d => d.OwnerId == apartment.OwnerId && 
                                             d.Month == currentMonth && 
                                             d.Year == currentYear &&
                                             d.Concept.Contains("Mantenimiento"));

                if (existingDebt == null)
                {
                    var maintenanceConcept = await context.PaymentConcepts
                        .FirstOrDefaultAsync(c => c.Code == PaymentConceptCodes.Maintenance && c.IsActive);
                    
                    if (maintenanceConcept == null)
                    {
                        _logger.LogError("Concepto de mantenimiento no encontrado");
                        continue;
                    }
                    
                    // Usar el monto del apartamento en lugar del concepto
                    var amount = apartment.MonthlyMaintenanceAmount;
                    
                    var debt = new Debt();
                    debt.Id = Guid.NewGuid();
                    debt.OwnerId = apartment.OwnerId!.Value;
                    debt.Amount = new Money(amount, "DOP");
                    debt.PaidAmount = new Money(0, "DOP");
                    debt.Month = currentMonth;
                    debt.Year = currentYear;
                    debt.DueDate = new DateTime(currentYear, currentMonth, DateTime.DaysInMonth(currentYear, currentMonth));
                    debt.Concept = $"Mantenimiento {DateHelper.GetMonthName(currentMonth)} {currentYear}";
                    debt.Status = StatusPayments.Pending;
                    debt.CreatedAt = DateTime.UtcNow;

                    context.Debts.Add(debt);
                    debtsCreated++;
                }
            }

            if (debtsCreated > 0)
            {
                await context.SaveChangesAsync();
                _logger.LogInformation("Generación completada: {Count} deudas creadas", debtsCreated);
            }
            else
            {
                _logger.LogInformation("No se crearon nuevas deudas - ya existen para este mes");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generando deudas mensuales");
            throw;
        }
    }
}
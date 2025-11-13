using CondoFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Data;

public static class CatalogSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // Seed categories
        if (!await context.Categories.AnyAsync())
        {
            var categories = new List<Category>
            {
                new() { Code = "plumbing", Name = "Plomería", Description = "Problemas relacionados con tuberías, grifos y sistemas de agua", IsActive = true },
                new() { Code = "electrical", Name = "Eléctrico", Description = "Problemas con instalaciones eléctricas, luces y enchufes", IsActive = true },
                new() { Code = "maintenance", Name = "Mantenimiento", Description = "Mantenimiento general de áreas comunes y privadas", IsActive = true },
                new() { Code = "security", Name = "Seguridad", Description = "Problemas de seguridad y acceso", IsActive = true },
                new() { Code = "cleaning", Name = "Limpieza", Description = "Problemas de limpieza en áreas comunes", IsActive = true },
                new() { Code = "other", Name = "Otros", Description = "Otras incidencias no clasificadas", IsActive = true }
            };
            context.Categories.AddRange(categories);
        }

        // Seed priorities
        if (!await context.Priorities.AnyAsync())
        {
            var priorities = new List<Priority>
            {
                new() { Code = "low", Name = "Baja", Description = "Prioridad baja - no urgente", IsActive = true },
                new() { Code = "medium", Name = "Media", Description = "Prioridad media - atención normal", IsActive = true },
                new() { Code = "high", Name = "Alta", Description = "Prioridad alta - requiere atención pronta", IsActive = true },
                new() { Code = "critical", Name = "Crítica", Description = "Prioridad crítica - requiere atención inmediata", IsActive = true }
            };
            context.Priorities.AddRange(priorities);
        }

        // Seed statuses
        if (!await context.Statuses.AnyAsync())
        {
            var statuses = new List<Status>
            {
                new() { Code = "pending", Name = "Pendiente", Description = "Estado pendiente", IsActive = true },
                new() { Code = "confirmed", Name = "Confirmada", Description = "Estado confirmado", IsActive = true },
                new() { Code = "rejected", Name = "Rechazada", Description = "Estado rechazado", IsActive = true },
                new() { Code = "cancelled", Name = "Cancelada", Description = "Estado cancelado", IsActive = true },
                new() { Code = "paid", Name = "Pagado", Description = "Estado pagado", IsActive = true }
            };
            context.Statuses.AddRange(statuses);
        }

        // Seed event types - agregar solo los que no existen
        var existingEventTypes = await context.EventTypes.Select(et => et.Code).ToListAsync();
        var newEventTypes = new List<EventType>();
        
        var allEventTypes = new List<(string Code, string Name, string Description, int Order)>
        {
            ("birthday", "Cumpleaños", "Celebración de cumpleaños", 1),
            ("meeting", "Reunión", "Reunión familiar o de trabajo", 2),
            ("celebration", "Celebración", "Celebración general", 3),
            ("wedding", "Boda", "Ceremonia de boda", 4),
            ("anniversary", "Aniversario", "Celebración de aniversario", 5),
            ("graduation", "Graduación", "Celebración de graduación", 6),
            ("baby_shower", "Baby Shower", "Celebración de baby shower", 7),
            ("quinceañera", "Quinceañera", "Celebración de quinceañera", 8),
            ("family_reunion", "Reunión Familiar", "Reunión familiar", 9),
            ("corporate", "Evento Corporativo", "Evento de empresa", 10),
            ("social", "Evento Social", "Evento social general", 11),
            ("other", "Otro", "Otro tipo de evento", 12)
        };
        
        foreach (var eventType in allEventTypes)
        {
            if (!existingEventTypes.Contains(eventType.Code))
            {
                newEventTypes.Add(new EventType
                {
                    Code = eventType.Code,
                    Name = eventType.Name,
                    Description = eventType.Description,
                    Order = eventType.Order,
                    IsActive = true
                });
            }
        }
        
        if (newEventTypes.Any())
        {
            context.EventTypes.AddRange(newEventTypes);
        }

        await context.SaveChangesAsync();
    }
}
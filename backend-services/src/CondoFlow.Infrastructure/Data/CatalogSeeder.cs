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

        // Seed event types
        if (!await context.EventTypes.AnyAsync())
        {
            var eventTypes = new List<EventType>
            {
                new() { Code = "birthday", Name = "Cumpleaños", Description = "Celebración de cumpleaños", Order = 1, IsActive = true },
                new() { Code = "wedding", Name = "Boda", Description = "Ceremonia de boda", Order = 2, IsActive = true },
                new() { Code = "anniversary", Name = "Aniversario", Description = "Celebración de aniversario", Order = 3, IsActive = true },
                new() { Code = "graduation", Name = "Graduación", Description = "Celebración de graduación", Order = 4, IsActive = true },
                new() { Code = "baby_shower", Name = "Baby Shower", Description = "Celebración de baby shower", Order = 5, IsActive = true },
                new() { Code = "quinceañera", Name = "Quinceañera", Description = "Celebración de quinceañera", Order = 6, IsActive = true },
                new() { Code = "family_reunion", Name = "Reunión Familiar", Description = "Reunión familiar", Order = 7, IsActive = true },
                new() { Code = "corporate", Name = "Evento Corporativo", Description = "Evento de empresa", Order = 8, IsActive = true },
                new() { Code = "social", Name = "Evento Social", Description = "Evento social general", Order = 9, IsActive = true },
                new() { Code = "other", Name = "Otro", Description = "Otro tipo de evento", Order = 10, IsActive = true }
            };
            context.EventTypes.AddRange(eventTypes);
        }

        await context.SaveChangesAsync();
    }
}
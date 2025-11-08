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
                new("plumbing", "Plomería", "Problemas relacionados con tuberías, grifos y sistemas de agua"),
                new("electrical", "Eléctrico", "Problemas con instalaciones eléctricas, luces y enchufes"),
                new("maintenance", "Mantenimiento", "Mantenimiento general de áreas comunes y privadas"),
                new("security", "Seguridad", "Problemas de seguridad y acceso"),
                new("cleaning", "Limpieza", "Problemas de limpieza en áreas comunes"),
                new("other", "Otros", "Otras incidencias no clasificadas")
            };
            context.Categories.AddRange(categories);
        }

        // Seed priorities
        if (!await context.Priorities.AnyAsync())
        {
            var priorities = new List<Priority>
            {
                new("low", "Baja", "Prioridad baja - no urgente"),
                new("medium", "Media", "Prioridad media - atención normal"),
                new("high", "Alta", "Prioridad alta - requiere atención pronta"),
                new("critical", "Crítica", "Prioridad crítica - requiere atención inmediata")
            };
            context.Priorities.AddRange(priorities);
        }

        // Seed statuses
        if (!await context.Statuses.AnyAsync())
        {
            var statuses = new List<Status>
            {
                // Estados para incidencias
                new("reported", "Reportada", "Incidencia recién reportada"),
                new("in_progress", "En Progreso", "Incidencia siendo atendida"),
                new("resolved", "Resuelta", "Incidencia resuelta exitosamente"),
                new("cancelled", "Cancelada", "Incidencia cancelada"),
                new("pending", "Pendiente", "Incidencia pendiente de información adicional"),
                
                // Estados para reservas
                new("Pending", "Pendiente", "Reserva pendiente de aprobación"),
                new("Confirmed", "Confirmada", "Reserva confirmada por administrador"),
                new("Rejected", "Rechazada", "Reserva rechazada por administrador"),
                new("Cancelled", "Cancelada", "Reserva cancelada por propietario"),
                new("Completed", "Completada", "Reserva completada exitosamente")
            };
            context.Statuses.AddRange(statuses);
        }

        // Seed event types
        if (!await context.EventTypes.AnyAsync())
        {
            var eventTypes = new List<EventType>
            {
                new("birthday", "Cumpleaños", "Celebración de cumpleaños") { Order = 1 },
                new("wedding", "Boda", "Ceremonia de boda") { Order = 2 },
                new("anniversary", "Aniversario", "Celebración de aniversario") { Order = 3 },
                new("graduation", "Graduación", "Celebración de graduación") { Order = 4 },
                new("baby_shower", "Baby Shower", "Celebración de baby shower") { Order = 5 },
                new("quinceañera", "Quinceañera", "Celebración de quinceañera") { Order = 6 },
                new("family_reunion", "Reunión Familiar", "Reunión familiar") { Order = 7 },
                new("corporate", "Evento Corporativo", "Evento de empresa") { Order = 8 },
                new("social", "Evento Social", "Evento social general") { Order = 9 },
                new("other", "Otro", "Otro tipo de evento") { Order = 10 }
            };
            context.EventTypes.AddRange(eventTypes);
        }

        await context.SaveChangesAsync();
    }
}
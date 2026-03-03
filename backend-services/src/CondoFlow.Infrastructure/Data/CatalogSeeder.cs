using CondoFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CondoFlow.Infrastructure.Data;

public static class CatalogSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // Seed categories (Incident Categories)
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
        
        var allEventTypes = new List<(string Code, string Name, string Description)>
        {
            ("birthday", "Cumpleaños", "Celebración de cumpleaños"),
            ("meeting", "Reunión", "Reunión familiar o de trabajo"),
            ("celebration", "Celebración", "Celebración general"),
            ("wedding", "Boda", "Ceremonia de boda"),
            ("anniversary", "Aniversario", "Celebración de aniversario"),
            ("graduation", "Graduación", "Celebración de graduación"),
            ("baby_shower", "Baby Shower", "Celebración de baby shower"),
            ("quinceañera", "Quinceañera", "Celebración de quinceañera"),
            ("family_reunion", "Reunión Familiar", "Reunión familiar"),
            ("corporate", "Evento Corporativo", "Evento de empresa"),
            ("social", "Evento Social", "Evento social general"),
            ("other", "Otro", "Otro tipo de evento")
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
                    IsActive = true
                });
            }
        }
        
        if (newEventTypes.Any())
        {
            context.EventTypes.AddRange(newEventTypes);
        }

        // Seed Blocks and Apartments
        if (!await context.Blocks.AnyAsync())
        {
            var blocks = new List<Block>
            {
                new() { Name = "M", Description = "Bloque M", IsActive = true },
                new() { Name = "N", Description = "Bloque N", IsActive = true },
                new() { Name = "O", Description = "Bloque O", IsActive = true },
                new() { Name = "P", Description = "Bloque P", IsActive = true },
                new() { Name = "Q", Description = "Bloque Q", IsActive = true }
            };
            context.Blocks.AddRange(blocks);
            await context.SaveChangesAsync();
            
            // Seed Apartments for each block (4 floors, 2 apartments per floor)
            foreach (var block in blocks)
            {
                var apartments = new List<Apartment>();
                for (int floor = 1; floor <= 4; floor++)
                {
                    apartments.Add(new Apartment 
                    { 
                        Number = $"{floor}01", 
                        Floor = floor, 
                        BlockId = block.Id, 
                        IsActive = true 
                    });
                    apartments.Add(new Apartment 
                    { 
                        Number = $"{floor}02", 
                        Floor = floor, 
                        BlockId = block.Id, 
                        IsActive = true 
                    });
                }
                context.Apartments.AddRange(apartments);
            }
        }

        // Seed Announcement Types
        if (!await context.AnnouncementTypes.AnyAsync())
        {
            var announcementTypes = new List<AnnouncementType>
            {
                new() { Name = "Informativo", Description = "Anuncios informativos generales", IsActive = true },
                new() { Name = "Urgente", Description = "Anuncios urgentes que requieren atención inmediata", IsActive = true },
                new() { Name = "Mantenimiento", Description = "Avisos de mantenimiento programado", IsActive = true },
                new() { Name = "Evento", Description = "Anuncios de eventos y actividades", IsActive = true }
            };
            context.AnnouncementTypes.AddRange(announcementTypes);
        }

        // Seed Payment Concepts
        if (!await context.PaymentConcepts.AnyAsync())
        {
            var paymentConcepts = new List<PaymentConcept>
            {
                new() { Code = "maintenance", Name = "Pago de Mantenimiento", DefaultAmount = 2000m, RoofAmount = 1000m, IsAutoCalculated = true, IsActive = true },
                new() { Code = "extraordinary", Name = "Cuota Extraordinaria", IsAutoCalculated = false, IsActive = true },
                new() { Code = "other", Name = "Otro", IsAutoCalculated = false, IsActive = true }
            };
            context.PaymentConcepts.AddRange(paymentConcepts);
        }

        // Seed Expense Categories
        if (!await context.ExpenseCategories.AnyAsync())
        {
            var expenseCategories = new List<ExpenseCategory>
            {
                new() { Name = "Mantenimiento", IsActive = true },
                new() { Name = "Limpieza", IsActive = true },
                new() { Name = "Seguridad", IsActive = true },
                new() { Name = "Servicios", IsActive = true },
                new() { Name = "Administración", IsActive = true },
                new() { Name = "Reparaciones", IsActive = true }
            };
            context.ExpenseCategories.AddRange(expenseCategories);
        }

        await context.SaveChangesAsync();
    }
}
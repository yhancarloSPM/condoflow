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
                new("reported", "Reportada", "Incidencia recién reportada"),
                new("in_progress", "En Progreso", "Incidencia siendo atendida"),
                new("resolved", "Resuelta", "Incidencia resuelta exitosamente"),
                new("cancelled", "Cancelada", "Incidencia cancelada"),
                new("pending", "Pendiente", "Incidencia pendiente de información adicional")
            };
            context.Statuses.AddRange(statuses);
        }

        await context.SaveChangesAsync();
    }
}
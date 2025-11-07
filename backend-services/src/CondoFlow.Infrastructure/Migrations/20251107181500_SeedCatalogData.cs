using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedCatalogData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Catalogs",
                columns: new[] { "Id", "Code", "Name", "Description", "CatalogType", "IsActive", "Order", "CreatedAt" },
                values: new object[,]
                {
                    // Incident Categories
                    { Guid.Parse("11111111-1111-1111-1111-111111111111"), "maintenance", "Mantenimiento", "Problemas de mantenimiento general", "IncidentCategory", true, 1, DateTime.UtcNow },
                    { Guid.Parse("11111111-1111-1111-1111-111111111112"), "common_areas", "Áreas Comunes", "Incidencias en áreas comunes", "IncidentCategory", true, 2, DateTime.UtcNow },
                    { Guid.Parse("11111111-1111-1111-1111-111111111113"), "security", "Seguridad", "Problemas de seguridad", "IncidentCategory", true, 3, DateTime.UtcNow },
                    { Guid.Parse("11111111-1111-1111-1111-111111111114"), "cleaning", "Limpieza", "Problemas de limpieza", "IncidentCategory", true, 4, DateTime.UtcNow },
                    { Guid.Parse("11111111-1111-1111-1111-111111111115"), "noise", "Ruido/Convivencia", "Problemas de ruido y convivencia", "IncidentCategory", true, 5, DateTime.UtcNow },
                    { Guid.Parse("11111111-1111-1111-1111-111111111116"), "suggestions", "Sugerencias", "Sugerencias de mejora", "IncidentCategory", true, 6, DateTime.UtcNow },
                    
                    // Incident Priorities
                    { Guid.Parse("22222222-2222-2222-2222-222222222221"), "critical", "🔴 Crítica/Urgente", "Requiere atención inmediata", "IncidentPriority", true, 1, DateTime.UtcNow },
                    { Guid.Parse("22222222-2222-2222-2222-222222222222"), "high", "🟡 Alta", "Requiere atención pronta", "IncidentPriority", true, 2, DateTime.UtcNow },
                    { Guid.Parse("22222222-2222-2222-2222-222222222223"), "medium", "🟢 Media", "Prioridad normal", "IncidentPriority", true, 3, DateTime.UtcNow },
                    { Guid.Parse("22222222-2222-2222-2222-222222222224"), "low", "🔵 Baja", "Puede esperar", "IncidentPriority", true, 4, DateTime.UtcNow },
                    
                    // Incident Statuses
                    { Guid.Parse("33333333-3333-3333-3333-333333333331"), "reported", "Reportada", "Incidencia reportada", "IncidentStatus", true, 1, DateTime.UtcNow },
                    { Guid.Parse("33333333-3333-3333-3333-333333333332"), "in_progress", "En Proceso", "Incidencia en proceso", "IncidentStatus", true, 2, DateTime.UtcNow },
                    { Guid.Parse("33333333-3333-3333-3333-333333333333"), "resolved", "Resuelta", "Incidencia resuelta", "IncidentStatus", true, 3, DateTime.UtcNow },
                    { Guid.Parse("33333333-3333-3333-3333-333333333334"), "cancelled", "Cancelada", "Incidencia cancelada", "IncidentStatus", true, 4, DateTime.UtcNow },
                    { Guid.Parse("33333333-3333-3333-3333-333333333335"), "rejected", "Rechazada", "Incidencia rechazada", "IncidentStatus", true, 5, DateTime.UtcNow }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Catalogs",
                keyColumn: "Id",
                keyValues: new object[]
                {
                    Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    Guid.Parse("11111111-1111-1111-1111-111111111112"),
                    Guid.Parse("11111111-1111-1111-1111-111111111113"),
                    Guid.Parse("11111111-1111-1111-1111-111111111114"),
                    Guid.Parse("11111111-1111-1111-1111-111111111115"),
                    Guid.Parse("11111111-1111-1111-1111-111111111116"),
                    Guid.Parse("22222222-2222-2222-2222-222222222221"),
                    Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    Guid.Parse("22222222-2222-2222-2222-222222222223"),
                    Guid.Parse("22222222-2222-2222-2222-222222222224"),
                    Guid.Parse("33333333-3333-3333-3333-333333333331"),
                    Guid.Parse("33333333-3333-3333-3333-333333333332"),
                    Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Guid.Parse("33333333-3333-3333-3333-333333333334"),
                    Guid.Parse("33333333-3333-3333-3333-333333333335")
                });
        }
    }
}
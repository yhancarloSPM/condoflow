using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDebtsManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Debts",
                columns: new[] { "Id", "Concept", "CreatedAt", "DueDate", "Month", "OwnerId", "Status", "UpdatedAt", "Year", "Amount", "Currency" },
                values: new object[,]
                {
                    { new Guid("87654321-4321-4321-4321-210987654322"), "Mantenimiento Noviembre 2024", new DateTime(2024, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 11, 30, 0, 0, 0, 0, DateTimeKind.Unspecified), 11, new Guid("12345678-1234-1234-1234-123456789012"), "Pending", null, 2024, 1800.00m, "DOP" },
                    { new Guid("87654321-4321-4321-4321-210987654323"), "Mantenimiento Octubre 2024", new DateTime(2024, 10, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 10, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), 10, new Guid("12345678-1234-1234-1234-123456789012"), "Paid", new DateTime(2024, 10, 15, 0, 0, 0, 0, DateTimeKind.Utc), 2024, 1800.00m, "DOP" },
                    { new Guid("87654321-4321-4321-4321-210987654324"), "Mantenimiento Enero 2025", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 1, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), 1, new Guid("12345678-1234-1234-1234-123456789012"), "Pending", null, 2025, 1800.00m, "DOP" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Debts",
                keyColumn: "Id",
                keyValue: new Guid("87654321-4321-4321-4321-210987654322"));

            migrationBuilder.DeleteData(
                table: "Debts",
                keyColumn: "Id",
                keyValue: new Guid("87654321-4321-4321-4321-210987654323"));

            migrationBuilder.DeleteData(
                table: "Debts",
                keyColumn: "Id",
                keyValue: new Guid("87654321-4321-4321-4321-210987654324"));
        }
    }
}

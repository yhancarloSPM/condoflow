using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentConcepts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PaymentConcepts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DefaultAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    RoofAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    IsAutoCalculated = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentConcepts", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "PaymentConcepts",
                columns: new[] { "Id", "Code", "CreatedAt", "DefaultAmount", "IsActive", "IsAutoCalculated", "Name", "RoofAmount", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), "maintenance", new DateTime(2025, 10, 26, 15, 33, 27, 643, DateTimeKind.Utc).AddTicks(6412), 1800m, true, true, "Pago de Mantenimiento", 900m, null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), "advance", new DateTime(2025, 10, 26, 15, 33, 27, 643, DateTimeKind.Utc).AddTicks(6867), 1800m, true, true, "Pago Adelantado de Mantenimiento", 900m, null },
                    { new Guid("33333333-3333-3333-3333-333333333333"), "partial", new DateTime(2025, 10, 26, 15, 33, 27, 643, DateTimeKind.Utc).AddTicks(6868), null, true, false, "Pago Parcial de Mantenimiento", null, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PaymentConcepts");
        }
    }
}

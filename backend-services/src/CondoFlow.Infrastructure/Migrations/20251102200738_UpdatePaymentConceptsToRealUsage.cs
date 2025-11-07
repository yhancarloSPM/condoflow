using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePaymentConceptsToRealUsage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "PaymentConcepts",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"));

            migrationBuilder.UpdateData(
                table: "PaymentConcepts",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "Code", "DefaultAmount", "IsAutoCalculated", "Name", "RoofAmount" },
                values: new object[] { "extraordinary", null, false, "Cuota Extraordinaria", null });

            migrationBuilder.UpdateData(
                table: "PaymentConcepts",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "Code", "Name" },
                values: new object[] { "other", "Otro" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "PaymentConcepts",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "Code", "DefaultAmount", "IsAutoCalculated", "Name", "RoofAmount" },
                values: new object[] { "maintenance", 2000m, true, "Pago de Mantenimiento", 1000m });

            migrationBuilder.UpdateData(
                table: "PaymentConcepts",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "Code", "Name" },
                values: new object[] { "advance", "Pago Adelantado de Mantenimiento" });

            migrationBuilder.InsertData(
                table: "PaymentConcepts",
                columns: new[] { "Id", "Code", "CreatedAt", "DefaultAmount", "IsActive", "IsAutoCalculated", "Name", "RoofAmount", "UpdatedAt" },
                values: new object[] { new Guid("33333333-3333-3333-3333-333333333333"), "partial", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, false, false, "Pago Parcial de Mantenimiento", null, null });
        }
    }
}

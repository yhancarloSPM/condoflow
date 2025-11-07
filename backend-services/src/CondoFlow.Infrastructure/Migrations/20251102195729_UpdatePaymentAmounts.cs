using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePaymentAmounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Debts",
                keyColumn: "Id",
                keyValue: new Guid("87654321-4321-4321-4321-210987654321"),
                column: "Amount",
                value: 2000.00m);

            migrationBuilder.UpdateData(
                table: "Debts",
                keyColumn: "Id",
                keyValue: new Guid("87654321-4321-4321-4321-210987654322"),
                column: "Amount",
                value: 2000.00m);

            migrationBuilder.UpdateData(
                table: "Debts",
                keyColumn: "Id",
                keyValue: new Guid("87654321-4321-4321-4321-210987654323"),
                columns: new[] { "Amount", "PaidAmount" },
                values: new object[] { 2000.00m, 2000.00m });

            migrationBuilder.UpdateData(
                table: "Debts",
                keyColumn: "Id",
                keyValue: new Guid("87654321-4321-4321-4321-210987654324"),
                column: "Amount",
                value: 2000.00m);

            migrationBuilder.UpdateData(
                table: "PaymentConcepts",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "DefaultAmount", "RoofAmount" },
                values: new object[] { 2000m, 1000m });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Debts",
                keyColumn: "Id",
                keyValue: new Guid("87654321-4321-4321-4321-210987654321"),
                column: "Amount",
                value: 1800.00m);

            migrationBuilder.UpdateData(
                table: "Debts",
                keyColumn: "Id",
                keyValue: new Guid("87654321-4321-4321-4321-210987654322"),
                column: "Amount",
                value: 1800.00m);

            migrationBuilder.UpdateData(
                table: "Debts",
                keyColumn: "Id",
                keyValue: new Guid("87654321-4321-4321-4321-210987654323"),
                columns: new[] { "Amount", "PaidAmount" },
                values: new object[] { 1800.00m, 1800.00m });

            migrationBuilder.UpdateData(
                table: "Debts",
                keyColumn: "Id",
                keyValue: new Guid("87654321-4321-4321-4321-210987654324"),
                column: "Amount",
                value: 1800.00m);

            migrationBuilder.UpdateData(
                table: "PaymentConcepts",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "DefaultAmount", "RoofAmount" },
                values: new object[] { 1800m, 900m });
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaidAmountToDebt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PaidAmount",
                table: "Debts",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "PaidCurrency",
                table: "Debts",
                type: "nvarchar(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Debts",
                keyColumn: "Id",
                keyValue: new Guid("87654321-4321-4321-4321-210987654321"),
                columns: new[] { "PaidAmount", "PaidCurrency" },
                values: new object[] { 0.00m, "DOP" });

            migrationBuilder.UpdateData(
                table: "Debts",
                keyColumn: "Id",
                keyValue: new Guid("87654321-4321-4321-4321-210987654322"),
                columns: new[] { "PaidAmount", "PaidCurrency" },
                values: new object[] { 0.00m, "DOP" });

            migrationBuilder.UpdateData(
                table: "Debts",
                keyColumn: "Id",
                keyValue: new Guid("87654321-4321-4321-4321-210987654323"),
                columns: new[] { "PaidAmount", "PaidCurrency" },
                values: new object[] { 1800.00m, "DOP" });

            migrationBuilder.UpdateData(
                table: "Debts",
                keyColumn: "Id",
                keyValue: new Guid("87654321-4321-4321-4321-210987654324"),
                columns: new[] { "PaidAmount", "PaidCurrency" },
                values: new object[] { 0.00m, "DOP" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaidAmount",
                table: "Debts");

            migrationBuilder.DropColumn(
                name: "PaidCurrency",
                table: "Debts");
        }
    }
}

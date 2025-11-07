using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMonthlyMaintenanceAmount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyMaintenanceAmount",
                table: "Apartments",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 1,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 2,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 3,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 4,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 5,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 6,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 7,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 8,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 9,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 10,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 11,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 12,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 13,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 14,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 15,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 16,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 17,
                column: "MonthlyMaintenanceAmount",
                value: 1000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 18,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 19,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 20,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 21,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 22,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 23,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 24,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 25,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 26,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 27,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 28,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 29,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 30,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 31,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 32,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 33,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 34,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 35,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 36,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 37,
                column: "MonthlyMaintenanceAmount",
                value: 2000m);

            migrationBuilder.UpdateData(
                table: "Apartments",
                keyColumn: "Id",
                keyValue: 38,
                column: "MonthlyMaintenanceAmount",
                value: 1000m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MonthlyMaintenanceAmount",
                table: "Apartments");
        }
    }
}

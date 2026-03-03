using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBlockIdToApplicationUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Check if BlockId column exists before adding
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'BlockId' AND object_id = OBJECT_ID('AspNetUsers'))
                BEGIN
                    ALTER TABLE [AspNetUsers] ADD [BlockId] int NULL;
                END
            ");

            migrationBuilder.UpdateData(
                table: "AnnouncementTypes",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Code", "Description", "Name" },
                values: new object[] { "informativo", "Comunicado informativo general", "INFORMATIVO" });

            migrationBuilder.UpdateData(
                table: "AnnouncementTypes",
                keyColumn: "Id",
                keyValue: 2,
                column: "Name",
                value: "EVENTO");

            migrationBuilder.UpdateData(
                table: "AnnouncementTypes",
                keyColumn: "Id",
                keyValue: 3,
                column: "Name",
                value: "AVISO");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BlockId",
                table: "AspNetUsers");

            // Check if Order column exists before adding
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'Order' AND object_id = OBJECT_ID('AnnouncementTypes'))
                BEGIN
                    ALTER TABLE [AnnouncementTypes] ADD [Order] int NOT NULL DEFAULT 0;
                END
            ");

            migrationBuilder.UpdateData(
                table: "AnnouncementTypes",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Code", "Description", "Name" },
                values: new object[] { "general", "Comunicado general informativo", "General" });

            migrationBuilder.UpdateData(
                table: "AnnouncementTypes",
                keyColumn: "Id",
                keyValue: 2,
                column: "Name",
                value: "Evento");

            migrationBuilder.UpdateData(
                table: "AnnouncementTypes",
                keyColumn: "Id",
                keyValue: 3,
                column: "Name",
                value: "Aviso");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAnnouncementTypeComplete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AnnouncementTypeId",
                table: "Announcements",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "AnnouncementTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnnouncementTypes", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "AnnouncementTypes",
                columns: new[] { "Id", "Code", "CreatedAt", "Description", "IsActive", "Name", "Order" },
                values: new object[,]
                {
                    { 1, "general", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Comunicado general informativo", true, "General", 1 },
                    { 2, "event", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Comunicado sobre eventos programados", true, "Evento", 2 },
                    { 3, "notice", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Avisos importantes para los propietarios", true, "Aviso", 3 }
                });

            // Update existing announcements to use valid AnnouncementTypeId
            migrationBuilder.Sql("UPDATE Announcements SET AnnouncementTypeId = 1 WHERE AnnouncementTypeId = 0");

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_AnnouncementTypeId",
                table: "Announcements",
                column: "AnnouncementTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementTypes_Code_Unique",
                table: "AnnouncementTypes",
                column: "Code",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Announcements_AnnouncementTypes_AnnouncementTypeId",
                table: "Announcements",
                column: "AnnouncementTypeId",
                principalTable: "AnnouncementTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Announcements_AnnouncementTypes_AnnouncementTypeId",
                table: "Announcements");

            migrationBuilder.DropTable(
                name: "AnnouncementTypes");

            migrationBuilder.DropIndex(
                name: "IX_Announcements_AnnouncementTypeId",
                table: "Announcements");

            migrationBuilder.DropColumn(
                name: "AnnouncementTypeId",
                table: "Announcements");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReservationCatalogsSimple : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Agregar campo EventTypeCode a Reservations
            migrationBuilder.AddColumn<string>(
                name: "EventTypeCode",
                table: "Reservations",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            // Crear tabla Catalogs
            migrationBuilder.CreateTable(
                name: "Catalogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CatalogType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Catalogs", x => x.Id);
                });

            // Crear índice único
            migrationBuilder.CreateIndex(
                name: "IX_Catalog_Type_Code_Unique",
                table: "Catalogs",
                columns: new[] { "CatalogType", "Code" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Eliminar tabla Catalogs
            migrationBuilder.DropTable(name: "Catalogs");

            // Eliminar columna EventTypeCode
            migrationBuilder.DropColumn(
                name: "EventTypeCode",
                table: "Reservations");
        }
    }
}
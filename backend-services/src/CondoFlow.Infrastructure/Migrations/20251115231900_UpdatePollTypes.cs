using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePollTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AllowOther",
                table: "Polls",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql("UPDATE Polls SET Type = Type + 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE Polls SET Type = Type - 1");
            
            migrationBuilder.DropColumn(
                name: "AllowOther",
                table: "Polls");
        }
    }
}

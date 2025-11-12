using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExpenseStatusRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Expenses_StatusId",
                table: "Expenses",
                column: "StatusId");

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_Statuses_StatusId",
                table: "Expenses",
                column: "StatusId",
                principalTable: "Statuses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_Statuses_StatusId",
                table: "Expenses");

            migrationBuilder.DropIndex(
                name: "IX_Expenses_StatusId",
                table: "Expenses");
        }
    }
}

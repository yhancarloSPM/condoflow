using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOwnerIdToPollVotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PollVote_Poll_User_Unique",
                table: "PollVotes");

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerId",
                table: "PollVotes",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_PollVote_Poll_Owner_Unique",
                table: "PollVotes",
                columns: new[] { "PollId", "OwnerId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PollVote_Poll_Owner_Unique",
                table: "PollVotes");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "PollVotes");

            migrationBuilder.CreateIndex(
                name: "IX_PollVote_Poll_User_Unique",
                table: "PollVotes",
                columns: new[] { "PollId", "UserId" },
                unique: true);
        }
    }
}

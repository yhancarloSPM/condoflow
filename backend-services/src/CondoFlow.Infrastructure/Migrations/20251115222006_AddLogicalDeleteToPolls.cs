using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLogicalDeleteToPolls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PollVote_Poll_Owner_Unique",
                table: "PollVotes");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "PollVotes");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Polls",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Polls",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_PollVote_Poll_User_Unique",
                table: "PollVotes",
                columns: new[] { "PollId", "UserId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PollVote_Poll_User_Unique",
                table: "PollVotes");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Polls");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Polls");

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
    }
}

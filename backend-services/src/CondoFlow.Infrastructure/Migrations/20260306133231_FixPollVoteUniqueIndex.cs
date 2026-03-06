using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixPollVoteUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PollVote_Poll_User_Unique",
                table: "PollVotes");

            migrationBuilder.CreateIndex(
                name: "IX_PollVote_Poll_User_Option_Unique",
                table: "PollVotes",
                columns: new[] { "PollId", "UserId", "PollOptionId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PollVote_Poll_User_Option_Unique",
                table: "PollVotes");

            migrationBuilder.CreateIndex(
                name: "IX_PollVote_Poll_User_Unique",
                table: "PollVotes",
                columns: new[] { "PollId", "UserId" },
                unique: true);
        }
    }
}

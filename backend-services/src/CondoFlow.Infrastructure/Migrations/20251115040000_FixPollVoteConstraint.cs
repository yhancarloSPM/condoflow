using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixPollVoteConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PollVote_Poll_Owner_Unique",
                table: "PollVotes");

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

            migrationBuilder.CreateIndex(
                name: "IX_PollVote_Poll_Owner_Unique",
                table: "PollVotes",
                columns: new[] { "PollId", "OwnerId" },
                unique: true);
        }
    }
}
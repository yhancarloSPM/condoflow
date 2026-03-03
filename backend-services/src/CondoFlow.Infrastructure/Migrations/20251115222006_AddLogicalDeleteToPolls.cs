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
            // Check if index exists before dropping
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PollVote_Poll_Owner_Unique' AND object_id = OBJECT_ID('PollVotes'))
                BEGIN
                    DROP INDEX [IX_PollVote_Poll_Owner_Unique] ON [PollVotes];
                END
            ");

            // Check if column exists before dropping
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE name = 'OwnerId' AND object_id = OBJECT_ID('PollVotes'))
                BEGIN
                    ALTER TABLE [PollVotes] DROP COLUMN [OwnerId];
                END
            ");

            // Check if DeletedAt column exists before adding
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'DeletedAt' AND object_id = OBJECT_ID('Polls'))
                BEGIN
                    ALTER TABLE [Polls] ADD [DeletedAt] datetime2 NULL;
                END
            ");

            // Check if IsDeleted column exists before adding
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'IsDeleted' AND object_id = OBJECT_ID('Polls'))
                BEGIN
                    ALTER TABLE [Polls] ADD [IsDeleted] bit NOT NULL DEFAULT 0;
                END
            ");

            // Check if index exists before creating
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PollVote_Poll_User_Unique' AND object_id = OBJECT_ID('PollVotes'))
                BEGIN
                    CREATE UNIQUE INDEX [IX_PollVote_Poll_User_Unique] ON [PollVotes] ([PollId], [UserId]);
                END
            ");
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

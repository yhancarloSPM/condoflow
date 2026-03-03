using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveOrderFromAnnouncementTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Check if Order column exists before dropping
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE name = 'Order' AND object_id = OBJECT_ID('AnnouncementTypes'))
                BEGIN
                    DECLARE @var sysname;
                    SELECT @var = [d].[name]
                    FROM [sys].[default_constraints] [d]
                    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
                    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[AnnouncementTypes]') AND [c].[name] = N'Order');
                    IF @var IS NOT NULL EXEC(N'ALTER TABLE [AnnouncementTypes] DROP CONSTRAINT [' + @var + '];');
                    ALTER TABLE [AnnouncementTypes] DROP COLUMN [Order];
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Order",
                table: "AnnouncementTypes",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}

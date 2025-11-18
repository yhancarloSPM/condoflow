using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateGeneralToInformativo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE AnnouncementTypes 
                SET Name = 'Informativo', 
                    Code = 'informativo',
                    Description = 'Comunicado informativo general'
                WHERE Code = 'general';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE AnnouncementTypes 
                SET Name = 'General', 
                    Code = 'general',
                    Description = 'Comunicado general informativo'
                WHERE Code = 'informativo';
            ");
        }
    }
}

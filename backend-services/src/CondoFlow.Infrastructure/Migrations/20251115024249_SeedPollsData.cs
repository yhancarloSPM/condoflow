using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CondoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedPollsData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Insertar encuesta de prueba
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM Polls)
                BEGIN
                    INSERT INTO Polls (Title, Description, Type, StartDate, EndDate, IsActive, IsAnonymous, ShowResults, CreatedBy, CreatedAt)
                    VALUES ('Horario de Limpieza', 'Votación para el horario de limpieza de áreas comunes', 0, GETDATE(), DATEADD(DAY, 7, GETDATE()), 1, 0, 1, 'admin', GETDATE());
                    
                    DECLARE @PollId INT = SCOPE_IDENTITY();
                    
                    INSERT INTO PollOptions (PollId, Text, [Order])
                    VALUES 
                    (@PollId, 'Mañana (8:00 AM - 12:00 PM)', 1),
                    (@PollId, 'Tarde (2:00 PM - 6:00 PM)', 2),
                    (@PollId, 'Noche (6:00 PM - 10:00 PM)', 3);
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM PollVotes; DELETE FROM PollOptions; DELETE FROM Polls;");
        }
    }
}

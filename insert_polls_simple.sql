-- Insertar datos básicos de encuestas para prueba
IF NOT EXISTS (SELECT 1 FROM Polls)
BEGIN
    -- Encuesta activa simple
    INSERT INTO Polls (Title, Description, Type, StartDate, EndDate, IsActive, IsAnonymous, ShowResults, CreatedBy, CreatedAt)
    VALUES 
    ('Horario de Limpieza', 'Votación para el horario de limpieza de áreas comunes', 0, GETDATE(), DATEADD(DAY, 7, GETDATE()), 1, 0, 1, 'admin', GETDATE());

    DECLARE @PollId INT = SCOPE_IDENTITY();

    -- Opciones
    INSERT INTO PollOptions (PollId, Text, [Order])
    VALUES 
    (@PollId, 'Mañana (8:00 AM - 12:00 PM)', 1),
    (@PollId, 'Tarde (2:00 PM - 6:00 PM)', 2),
    (@PollId, 'Noche (6:00 PM - 10:00 PM)', 3);

    PRINT 'Encuesta de prueba creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Ya existen encuestas en la base de datos';
END
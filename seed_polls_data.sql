-- Insertar datos de ejemplo para encuestas
-- Primero verificamos si ya existen datos
IF NOT EXISTS (SELECT 1 FROM Polls)
BEGIN
    -- Encuesta 1: Votación simple sobre horario de limpieza
    INSERT INTO Polls (Title, Description, Type, StartDate, EndDate, IsActive, IsAnonymous, ShowResults, QuorumRequired, CreatedBy, CreatedAt)
    VALUES 
    ('Horario de Limpieza de Áreas Comunes', 
     'Votación para decidir el mejor horario para la limpieza de las áreas comunes del condominio', 
     0, -- Simple (0 = Simple: una opción, 1 = Multiple: varias opciones)
     GETDATE(), 
     DATEADD(DAY, 7, GETDATE()), 
     1, -- IsActive
     0, -- No anónima
     1, -- Mostrar resultados
     NULL, -- Sin quórum requerido
     'admin@condoflow.com', 
     GETDATE());

    DECLARE @Poll1Id INT = SCOPE_IDENTITY();

    -- Opciones para la encuesta 1
    INSERT INTO PollOptions (PollId, Text, [Order])
    VALUES 
    (@Poll1Id, 'Mañana (8:00 AM - 12:00 PM)', 1),
    (@Poll1Id, 'Tarde (2:00 PM - 6:00 PM)', 2),
    (@Poll1Id, 'Noche (6:00 PM - 10:00 PM)', 3);

    -- Encuesta 2: Votación múltiple sobre mejoras
    INSERT INTO Polls (Title, Description, Type, StartDate, EndDate, IsActive, IsAnonymous, ShowResults, QuorumRequired, CreatedBy, CreatedAt)
    VALUES 
    ('Mejoras para el Condominio 2025', 
     'Selecciona las mejoras que consideras más importantes para implementar en el 2025. Puedes elegir múltiples opciones.', 
     1, -- Multiple (permite seleccionar varias opciones)
     GETDATE(), 
     DATEADD(DAY, 14, GETDATE()), 
     1, -- IsActive
     1, -- Anónima
     1, -- Mostrar resultados
     10, -- Quórum de 10 votos
     'admin@condoflow.com', 
     GETDATE());

    DECLARE @Poll2Id INT = SCOPE_IDENTITY();

    -- Opciones para la encuesta 2
    INSERT INTO PollOptions (PollId, Text, [Order])
    VALUES 
    (@Poll2Id, 'Renovación del área de juegos infantiles', 1),
    (@Poll2Id, 'Instalación de cámaras de seguridad adicionales', 2),
    (@Poll2Id, 'Mejora del sistema de iluminación', 3),
    (@Poll2Id, 'Creación de un gimnasio comunitario', 4),
    (@Poll2Id, 'Renovación de la piscina', 5);

    -- Encuesta 3: Encuesta cerrada para pruebas
    INSERT INTO Polls (Title, Description, Type, StartDate, EndDate, IsActive, IsAnonymous, ShowResults, QuorumRequired, CreatedBy, CreatedAt)
    VALUES 
    ('Reunión de Propietarios - Noviembre', 
     'Votación sobre la fecha para la reunión mensual de propietarios de noviembre', 
     0, -- Simple
     DATEADD(DAY, -10, GETDATE()), 
     DATEADD(DAY, -3, GETDATE()), 
     0, -- No activa (cerrada)
     0, -- No anónima
     1, -- Mostrar resultados
     NULL, -- Sin quórum
     'admin@condoflow.com', 
     DATEADD(DAY, -10, GETDATE()));

    DECLARE @Poll3Id INT = SCOPE_IDENTITY();

    -- Opciones para la encuesta 3
    INSERT INTO PollOptions (PollId, Text, [Order])
    VALUES 
    (@Poll3Id, 'Sábado 16 de Noviembre - 10:00 AM', 1),
    (@Poll3Id, 'Domingo 17 de Noviembre - 4:00 PM', 2),
    (@Poll3Id, 'Sábado 23 de Noviembre - 10:00 AM', 3);

    -- Algunos votos de ejemplo para la encuesta cerrada
    -- Nota: Estos UserId deben existir en la tabla AspNetUsers
    -- Por ahora usaremos IDs genéricos que se pueden ajustar después
    INSERT INTO PollVotes (PollId, PollOptionId, UserId, VotedAt)
    SELECT 
        @Poll3Id,
        (SELECT TOP 1 Id FROM PollOptions WHERE PollId = @Poll3Id ORDER BY [Order]),
        'sample-user-1',
        DATEADD(DAY, -8, GETDATE())
    WHERE NOT EXISTS (SELECT 1 FROM PollVotes WHERE PollId = @Poll3Id AND UserId = 'sample-user-1');

    INSERT INTO PollVotes (PollId, PollOptionId, UserId, VotedAt)
    SELECT 
        @Poll3Id,
        (SELECT TOP 1 Id FROM PollOptions WHERE PollId = @Poll3Id AND [Order] = 2),
        'sample-user-2',
        DATEADD(DAY, -7, GETDATE())
    WHERE NOT EXISTS (SELECT 1 FROM PollVotes WHERE PollId = @Poll3Id AND UserId = 'sample-user-2');

    PRINT 'Datos de ejemplo para encuestas insertados correctamente';
END
ELSE
BEGIN
    PRINT 'Ya existen datos en la tabla Polls, no se insertaron datos de ejemplo';
END
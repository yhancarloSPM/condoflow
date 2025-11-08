-- Insertar solo los estados de reservas que faltan en la tabla Statuses

-- Verificar si ya existen antes de insertar
IF NOT EXISTS (SELECT 1 FROM Statuses WHERE Code = 'confirmed')
BEGIN
    INSERT INTO Statuses (Id, Code, Name, Description, IsActive, CreatedAt)
    VALUES (NEWID(), 'confirmed', 'Confirmada', 'Reserva confirmada', 1, GETDATE());
    PRINT 'Estado "confirmed" insertado';
END
ELSE
    PRINT 'Estado "confirmed" ya existe';

IF NOT EXISTS (SELECT 1 FROM Statuses WHERE Code = 'rejected')
BEGIN
    INSERT INTO Statuses (Id, Code, Name, Description, IsActive, CreatedAt)
    VALUES (NEWID(), 'rejected', 'Rechazada', 'Reserva rechazada', 1, GETDATE());
    PRINT 'Estado "rejected" insertado';
END
ELSE
    PRINT 'Estado "rejected" ya existe';

IF NOT EXISTS (SELECT 1 FROM Statuses WHERE Code = 'completed')
BEGIN
    INSERT INTO Statuses (Id, Code, Name, Description, IsActive, CreatedAt)
    VALUES (NEWID(), 'completed', 'Completada', 'Reserva completada', 1, GETDATE());
    PRINT 'Estado "completed" insertado';
END
ELSE
    PRINT 'Estado "completed" ya existe';

-- Verificar los nuevos datos
SELECT 'Estados de reservas disponibles:' as Info;
SELECT Code, Name, Description, IsActive 
FROM Statuses 
WHERE Code IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')
ORDER BY Code;
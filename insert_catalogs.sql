-- Insertar estados de reserva en tabla Statuses
INSERT INTO Statuses (Id, Code, Name, Description, IsActive, CreatedAt)
VALUES 
    (NEWID(), 'Pending', 'Pendiente', 'Reserva pendiente de aprobación', 1, GETUTCDATE()),
    (NEWID(), 'Confirmed', 'Confirmada', 'Reserva confirmada por administrador', 1, GETUTCDATE()),
    (NEWID(), 'Rejected', 'Rechazada', 'Reserva rechazada por administrador', 1, GETUTCDATE()),
    (NEWID(), 'Cancelled', 'Cancelada', 'Reserva cancelada por propietario', 1, GETUTCDATE()),
    (NEWID(), 'Completed', 'Completada', 'Reserva completada exitosamente', 1, GETUTCDATE());

-- Insertar tipos de evento en tabla EventTypes
INSERT INTO EventTypes (Id, Code, Name, Description, IsActive, [Order], CreatedAt)
VALUES 
    (NEWID(), 'birthday', 'Cumpleaños', 'Celebración de cumpleaños', 1, 1, GETUTCDATE()),
    (NEWID(), 'wedding', 'Boda', 'Ceremonia de boda', 1, 2, GETUTCDATE()),
    (NEWID(), 'anniversary', 'Aniversario', 'Celebración de aniversario', 1, 3, GETUTCDATE()),
    (NEWID(), 'graduation', 'Graduación', 'Celebración de graduación', 1, 4, GETUTCDATE()),
    (NEWID(), 'baby_shower', 'Baby Shower', 'Celebración de baby shower', 1, 5, GETUTCDATE()),
    (NEWID(), 'quinceañera', 'Quinceañera', 'Celebración de quinceañera', 1, 6, GETUTCDATE()),
    (NEWID(), 'family_reunion', 'Reunión Familiar', 'Reunión familiar', 1, 7, GETUTCDATE()),
    (NEWID(), 'corporate', 'Evento Corporativo', 'Evento de empresa', 1, 8, GETUTCDATE()),
    (NEWID(), 'social', 'Evento Social', 'Evento social general', 1, 9, GETUTCDATE()),
    (NEWID(), 'other', 'Otro', 'Otro tipo de evento', 1, 10, GETUTCDATE());
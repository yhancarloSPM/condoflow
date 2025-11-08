-- Insertar estados para reservas
INSERT INTO Statuses (Id, Code, Name, Description, IsActive, CreatedAt) VALUES
('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Pending', 'Pendiente', 'Reserva pendiente de aprobación', 1, '2024-01-01 00:00:00'),
('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'Confirmed', 'Confirmada', 'Reserva confirmada', 1, '2024-01-01 00:00:00'),
('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Rejected', 'Rechazada', 'Reserva rechazada', 1, '2024-01-01 00:00:00'),
('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'Cancelled', 'Cancelada', 'Reserva cancelada', 1, '2024-01-01 00:00:00');

-- Insertar estados para incidencias
INSERT INTO Statuses (Id, Code, Name, Description, IsActive, CreatedAt) VALUES
('e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', 'reported', 'Reportada', 'Incidencia reportada', 1, '2024-01-01 00:00:00'),
('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6', 'in_progress', 'En Proceso', 'Incidencia en proceso', 1, '2024-01-01 00:00:00'),
('a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7', 'resolved', 'Resuelta', 'Incidencia resuelta', 1, '2024-01-01 00:00:00'),
('b8b8b8b8-b8b8-b8b8-b8b8-b8b8b8b8b8b8', 'rejected', 'Rechazada', 'Incidencia rechazada', 1, '2024-01-01 00:00:00'),
('c9c9c9c9-c9c9-c9c9-c9c9-c9c9c9c9c9c9', 'cancelled', 'Cancelada', 'Incidencia cancelada', 1, '2024-01-01 00:00:00');

-- Insertar tipos de eventos
INSERT INTO EventTypes (Id, Code, Name, Description, IsActive, [Order], CreatedAt) VALUES
('e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', 'birthday', 'Cumpleaños', 'Celebración de cumpleaños', 1, 1, '2024-01-01 00:00:00'),
('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6', 'meeting', 'Reunión', 'Reunión familiar o de trabajo', 1, 2, '2024-01-01 00:00:00'),
('a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7', 'celebration', 'Celebración', 'Celebración general', 1, 3, '2024-01-01 00:00:00');
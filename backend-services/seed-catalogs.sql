-- Seed data for Catalogs table
INSERT INTO Catalogs (Id, Code, Name, Description, CatalogType, IsActive, [Order], CreatedAt) VALUES 
-- Incident Categories
('11111111-1111-1111-1111-111111111111', 'maintenance', 'Mantenimiento', 'Problemas de mantenimiento general', 'IncidentCategory', 1, 1, GETUTCDATE()),
('11111111-1111-1111-1111-111111111112', 'common_areas', 'Áreas Comunes', 'Incidencias en áreas comunes', 'IncidentCategory', 1, 2, GETUTCDATE()),
('11111111-1111-1111-1111-111111111113', 'security', 'Seguridad', 'Problemas de seguridad', 'IncidentCategory', 1, 3, GETUTCDATE()),
('11111111-1111-1111-1111-111111111114', 'cleaning', 'Limpieza', 'Problemas de limpieza', 'IncidentCategory', 1, 4, GETUTCDATE()),
('11111111-1111-1111-1111-111111111115', 'noise', 'Ruido/Convivencia', 'Problemas de ruido y convivencia', 'IncidentCategory', 1, 5, GETUTCDATE()),
('11111111-1111-1111-1111-111111111116', 'suggestions', 'Sugerencias', 'Sugerencias de mejora', 'IncidentCategory', 1, 6, GETUTCDATE()),

-- Incident Priorities  
('22222222-2222-2222-2222-222222222221', 'critical', '🔴 Crítica/Urgente', 'Requiere atención inmediata', 'IncidentPriority', 1, 1, GETUTCDATE()),
('22222222-2222-2222-2222-222222222222', 'high', '🟡 Alta', 'Requiere atención pronta', 'IncidentPriority', 1, 2, GETUTCDATE()),
('22222222-2222-2222-2222-222222222223', 'medium', '🟢 Media', 'Prioridad normal', 'IncidentPriority', 1, 3, GETUTCDATE()),
('22222222-2222-2222-2222-222222222224', 'low', '🔵 Baja', 'Puede esperar', 'IncidentPriority', 1, 4, GETUTCDATE()),

-- Incident Statuses
('33333333-3333-3333-3333-333333333331', 'reported', 'Reportada', 'Incidencia reportada', 'IncidentStatus', 1, 1, GETUTCDATE()),
('33333333-3333-3333-3333-333333333332', 'in_progress', 'En Proceso', 'Incidencia en proceso', 'IncidentStatus', 1, 2, GETUTCDATE()),
('33333333-3333-3333-3333-333333333333', 'resolved', 'Resuelta', 'Incidencia resuelta', 'IncidentStatus', 1, 3, GETUTCDATE()),
('33333333-3333-3333-3333-333333333334', 'cancelled', 'Cancelada', 'Incidencia cancelada', 'IncidentStatus', 1, 4, GETUTCDATE()),
('33333333-3333-3333-3333-333333333335', 'rejected', 'Rechazada', 'Incidencia rechazada', 'IncidentStatus', 1, 5, GETUTCDATE());
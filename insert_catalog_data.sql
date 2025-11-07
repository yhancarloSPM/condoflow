-- Insertar datos del catálogo
INSERT INTO Catalogs (Id, Type, Code, Name, Description, IsActive, CreatedAt, UpdatedAt) VALUES
-- Categorías
(NEWID(), 'IncidentCategory', 'plumbing', 'Plomería', 'Problemas relacionados con tuberías, grifos y sistemas de agua', 1, GETDATE(), GETDATE()),
(NEWID(), 'IncidentCategory', 'electrical', 'Eléctrico', 'Problemas con instalaciones eléctricas, luces y enchufes', 1, GETDATE(), GETDATE()),
(NEWID(), 'IncidentCategory', 'maintenance', 'Mantenimiento', 'Mantenimiento general de áreas comunes y privadas', 1, GETDATE(), GETDATE()),
(NEWID(), 'IncidentCategory', 'security', 'Seguridad', 'Problemas de seguridad y acceso', 1, GETDATE(), GETDATE()),
(NEWID(), 'IncidentCategory', 'cleaning', 'Limpieza', 'Problemas de limpieza en áreas comunes', 1, GETDATE(), GETDATE()),
(NEWID(), 'IncidentCategory', 'other', 'Otros', 'Otras incidencias no clasificadas', 1, GETDATE(), GETDATE()),

-- Prioridades
(NEWID(), 'IncidentPriority', 'low', 'Baja', 'Prioridad baja - no urgente', 1, GETDATE(), GETDATE()),
(NEWID(), 'IncidentPriority', 'medium', 'Media', 'Prioridad media - atención normal', 1, GETDATE(), GETDATE()),
(NEWID(), 'IncidentPriority', 'high', 'Alta', 'Prioridad alta - requiere atención pronta', 1, GETDATE(), GETDATE()),
(NEWID(), 'IncidentPriority', 'critical', 'Crítica', 'Prioridad crítica - requiere atención inmediata', 1, GETDATE(), GETDATE()),

-- Estados
(NEWID(), 'IncidentStatus', 'reported', 'Reportada', 'Incidencia recién reportada', 1, GETDATE(), GETDATE()),
(NEWID(), 'IncidentStatus', 'in_progress', 'En Progreso', 'Incidencia siendo atendida', 1, GETDATE(), GETDATE()),
(NEWID(), 'IncidentStatus', 'resolved', 'Resuelta', 'Incidencia resuelta exitosamente', 1, GETDATE(), GETDATE()),
(NEWID(), 'IncidentStatus', 'cancelled', 'Cancelada', 'Incidencia cancelada', 1, GETDATE(), GETDATE()),
(NEWID(), 'IncidentStatus', 'pending', 'Pendiente', 'Incidencia pendiente de información adicional', 1, GETDATE(), GETDATE());
INSERT INTO EventTypes (Code, Name, Description, IsActive, [Order], CreatedAt) VALUES
('wedding', 'Boda', 'Ceremonia de boda', 1, 4, GETDATE()),
('anniversary', 'Aniversario', 'Celebración de aniversario', 1, 5, GETDATE()),
('graduation', 'Graduación', 'Celebración de graduación', 1, 6, GETDATE()),
('baby_shower', 'Baby Shower', 'Celebración de baby shower', 1, 7, GETDATE()),
('quinceañera', 'Quinceañera', 'Celebración de quinceañera', 1, 8, GETDATE()),
('family_reunion', 'Reunión Familiar', 'Reunión familiar', 1, 9, GETDATE()),
('corporate', 'Evento Corporativo', 'Evento de empresa', 1, 10, GETDATE()),
('social', 'Evento Social', 'Evento social general', 1, 11, GETDATE()),
('other', 'Otro', 'Otro tipo de evento', 1, 12, GETDATE());
-- Actualizar "General" a "Informativo"
UPDATE AnnouncementTypes 
SET Name = 'Informativo', 
    Code = 'informativo',
    Description = 'Comunicado informativo general'
WHERE Code = 'general';

-- Verificar cambios
SELECT Id, Code, Name, Description, [Order] FROM AnnouncementTypes ORDER BY Name;
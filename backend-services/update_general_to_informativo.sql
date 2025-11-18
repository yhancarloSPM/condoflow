-- Actualizar el tipo "General" a "Informativo"
UPDATE AnnouncementTypes 
SET Name = 'Informativo', 
    Code = 'INFORMATIVO'
WHERE Name = 'General' OR Code = 'GENERAL';

-- Verificar el cambio
SELECT * FROM AnnouncementTypes WHERE Code = 'INFORMATIVO';
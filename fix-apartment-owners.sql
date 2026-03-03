-- Script para vincular Apartments con sus propietarios (ApplicationUser)
-- Actualiza el campo OwnerId en Apartments basándose en la información de AspNetUsers

UPDATE a
SET a.OwnerId = u.OwnerId
FROM Apartments a
INNER JOIN Blocks b ON a.BlockId = b.Id
INNER JOIN AspNetUsers u ON u.Block = b.Number AND u.Apartment = a.Number
WHERE a.OwnerId IS NULL 
  AND u.OwnerId IS NOT NULL
  AND u.IsApproved = 1;

-- Verificar los resultados
SELECT 
    a.Id as ApartmentId,
    a.Number as ApartmentNumber,
    b.Number as BlockNumber,
    a.OwnerId,
    u.FirstName + ' ' + u.LastName as OwnerName,
    u.Email as OwnerEmail
FROM Apartments a
INNER JOIN Blocks b ON a.BlockId = b.Id
LEFT JOIN AspNetUsers u ON a.OwnerId = u.OwnerId
ORDER BY b.Number, a.Number;

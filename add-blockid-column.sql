-- Paso 1: Agregar columna BlockId a AspNetUsers (si no existe)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AspNetUsers]') AND name = 'BlockId')
BEGIN
    ALTER TABLE AspNetUsers ADD BlockId int NULL;
END
GO

-- Paso 2: Actualizar BlockId para usuarios existentes basándose en el nombre del bloque
UPDATE u
SET u.BlockId = b.Id
FROM AspNetUsers u
INNER JOIN Blocks b ON u.Block = b.Name
WHERE u.BlockId IS NULL AND u.Block IS NOT NULL;
GO

-- Paso 3: Eliminar columna Block (si existe)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AspNetUsers]') AND name = 'Block')
BEGIN
    ALTER TABLE AspNetUsers DROP COLUMN Block;
END
GO

-- Verificar resultados
SELECT 
    Id,
    FirstName + ' ' + LastName as FullName,
    Email,
    BlockId,
    Apartment,
    OwnerId
FROM AspNetUsers
WHERE BlockId IS NOT NULL
ORDER BY BlockId, Apartment;

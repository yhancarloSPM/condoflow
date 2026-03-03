SET QUOTED_IDENTIFIER ON;
GO

-- Step 1: Populate BlockId in AspNetUsers based on their Apartment's BlockId
UPDATE u
SET u.BlockId = a.BlockId
FROM AspNetUsers u
INNER JOIN Apartments a ON u.ApartmentId = a.Id
WHERE u.BlockId IS NULL AND u.ApartmentId IS NOT NULL;
GO

-- Step 2: Populate OwnerId in Apartments based on AspNetUsers.OwnerId
UPDATE a
SET a.OwnerId = u.OwnerId
FROM Apartments a
INNER JOIN AspNetUsers u ON a.Id = u.ApartmentId
WHERE a.OwnerId IS NULL AND u.OwnerId IS NOT NULL;
GO

-- Verify the changes
SELECT 'AspNetUsers with BlockId' AS TableInfo, COUNT(*) AS Count FROM AspNetUsers WHERE BlockId IS NOT NULL
UNION ALL
SELECT 'AspNetUsers with OwnerId', COUNT(*) FROM AspNetUsers WHERE OwnerId IS NOT NULL
UNION ALL
SELECT 'Apartments with OwnerId', COUNT(*) FROM Apartments WHERE OwnerId IS NOT NULL;
GO

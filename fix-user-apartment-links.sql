SET QUOTED_IDENTIFIER ON;
GO

-- First, let's see what we have
SELECT 'Current State' AS Info;
SELECT u.UserName, u.Apartment AS AptNumber, u.BlockId, u.ApartmentId, u.OwnerId
FROM AspNetUsers u
WHERE u.Apartment IS NOT NULL;
GO

-- Update ApartmentId in AspNetUsers by matching Apartment number and BlockId
-- Note: We need to match based on the apartment number stored in the Apartment field
-- But we don't have BlockId yet, so we'll need to do this differently

-- Let's check if there's a pattern we can use
SELECT DISTINCT u.Apartment, COUNT(*) as UserCount
FROM AspNetUsers u
WHERE u.Apartment IS NOT NULL
GROUP BY u.Apartment;
GO

-- Check apartments table
SELECT a.Id, a.Number, a.BlockId, b.Name as BlockName
FROM Apartments a
INNER JOIN Blocks b ON a.BlockId = b.Id
WHERE a.Number IN (SELECT DISTINCT Apartment FROM AspNetUsers WHERE Apartment IS NOT NULL)
ORDER BY a.Number, b.Name;
GO

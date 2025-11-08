-- Verificar datos existentes en las tablas de catálogos

-- Verificar datos en tabla Statuses
SELECT 'Statuses' as TableName, Id, Code, Name, Description, IsActive 
FROM Statuses
ORDER BY Id;

-- Verificar datos en tabla EventTypes  
SELECT 'EventTypes' as TableName, Id, Code, Name, Description, [Order], IsActive
FROM EventTypes
ORDER BY [Order];
-- Verificar que las tablas de encuestas existen
SELECT 
    TABLE_NAME,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('Polls', 'PollOptions', 'PollVotes')
ORDER BY TABLE_NAME;

-- Verificar estructura de la tabla Polls
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Polls'
ORDER BY ORDINAL_POSITION;

-- Verificar estructura de la tabla PollOptions
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'PollOptions'
ORDER BY ORDINAL_POSITION;

-- Verificar estructura de la tabla PollVotes
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'PollVotes'
ORDER BY ORDINAL_POSITION;

-- Verificar índices y constraints
SELECT 
    i.name AS IndexName,
    t.name AS TableName,
    c.name AS ColumnName,
    i.is_unique
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('Polls', 'PollOptions', 'PollVotes')
ORDER BY t.name, i.name;
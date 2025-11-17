-- Limpiar votos duplicados y actualizar OwnerId
DELETE FROM PollVotes;

-- Resetear identity si es necesario
DBCC CHECKIDENT ('PollVotes', RESEED, 0);
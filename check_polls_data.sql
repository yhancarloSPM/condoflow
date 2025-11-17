-- Verificar datos existentes en tablas de encuestas
SELECT COUNT(*) as TotalPolls FROM Polls;
SELECT COUNT(*) as TotalOptions FROM PollOptions;  
SELECT COUNT(*) as TotalVotes FROM PollVotes;

-- Ver encuestas existentes
SELECT Id, Title, Type, IsActive, StartDate, EndDate FROM Polls;
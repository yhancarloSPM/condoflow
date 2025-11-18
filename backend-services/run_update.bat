@echo off
echo Ejecutando actualizacion de tipos de anuncio...
sqlcmd -S localhost -d CondoFlowDB -E -Q "UPDATE AnnouncementTypes SET Name = 'Informativo', Code = 'informativo', Description = 'Comunicado informativo general' WHERE Code = 'general'; SELECT Id, Code, Name FROM AnnouncementTypes ORDER BY Name;"
pause
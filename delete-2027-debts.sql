-- Eliminar deudas del año 2027 (creadas para pruebas)
DELETE FROM Debts WHERE Year = 2027;

-- Verificar que se eliminaron
SELECT COUNT(*) as 'Deudas restantes' FROM Debts;
SELECT DISTINCT Year as 'Años con deudas' FROM Debts ORDER BY Year;

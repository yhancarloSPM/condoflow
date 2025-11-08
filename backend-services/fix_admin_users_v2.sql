SET QUOTED_IDENTIFIER ON;

-- Activar y desbloquear usuarios admin
UPDATE AspNetUsers 
SET EmailConfirmed = 1, 
    LockoutEnabled = 0,
    LockoutEnd = NULL
WHERE Email IN ('admin@condoflow.com', 'admin@gmail.com');

-- Verificar cambios
SELECT 
    Email,
    EmailConfirmed,
    LockoutEnabled,
    LockoutEnd
FROM AspNetUsers 
WHERE Email IN ('admin@condoflow.com', 'admin@gmail.com');
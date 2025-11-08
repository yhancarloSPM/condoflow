SET QUOTED_IDENTIFIER ON;

-- Verificar estado actual del usuario admin
SELECT 
    Email,
    IsApproved,
    IsRejected,
    EmailConfirmed,
    LockoutEnabled,
    LockoutEnd
FROM AspNetUsers 
WHERE Email = 'admin@gmail.com';

-- Activar completamente el usuario admin
UPDATE AspNetUsers 
SET IsApproved = 1,
    IsRejected = 0,
    EmailConfirmed = 1,
    LockoutEnabled = 0,
    LockoutEnd = NULL
WHERE Email = 'admin@gmail.com';

-- Verificar cambios
SELECT 
    Email,
    IsApproved,
    IsRejected,
    EmailConfirmed,
    LockoutEnabled,
    LockoutEnd
FROM AspNetUsers 
WHERE Email = 'admin@gmail.com';
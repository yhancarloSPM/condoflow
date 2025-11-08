-- Verificar usuarios admin existentes
SELECT 
    u.Id,
    u.Email,
    u.UserName,
    u.EmailConfirmed,
    u.LockoutEnabled,
    u.LockoutEnd,
    ur.RoleId,
    r.Name as RoleName
FROM AspNetUsers u
LEFT JOIN AspNetUserRoles ur ON u.Id = ur.UserId
LEFT JOIN AspNetRoles r ON ur.RoleId = r.Id
WHERE r.Name = 'Admin' OR u.Email LIKE '%admin%'
ORDER BY u.Email;
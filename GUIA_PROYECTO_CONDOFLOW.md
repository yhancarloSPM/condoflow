# 📘 Guía del Proyecto CondoFlow

## 🎯 Estado Actual del Proyecto

### ✅ Servicios Corriendo:
- **Frontend Angular**: http://localhost:4200/
- **Backend .NET API**: http://localhost:7009/
- **Base de Datos**: SQL Server en Docker (puerto 1433)

---

## 🚀 Inicio Rápido

### 1. Levantar Base de Datos (Docker)
```bash
docker start condoflow-sql
```

### 2. Levantar Backend
```bash
cd backend-services/src/CondoFlow.WebApi
dotnet run
```

### 3. Levantar Frontend
```bash
cd web-portal/condoflow-web
npm start
```

### 4. Acceder a la Aplicación
- Frontend: http://localhost:4200/
- Backend API: http://localhost:7009/
- Swagger: http://localhost:7009/swagger (en desarrollo)

---

## 📁 Estructura del Proyecto

```
CondoFlow/
├── backend-services/
│   ├── src/
│   │   ├── CondoFlow.Domain/          # Entidades y lógica de negocio
│   │   ├── CondoFlow.Application/     # DTOs y servicios de aplicación
│   │   ├── CondoFlow.Infrastructure/  # Repositorios, DbContext, Migraciones
│   │   └── CondoFlow.WebApi/          # Controllers, API endpoints
│   └── tests/                         # Pruebas unitarias e integración
│
├── web-portal/
│   └── condoflow-web/                 # Aplicación Angular
│       ├── src/app/
│       │   ├── core/                  # Servicios, guards, interceptors
│       │   ├── features/              # Módulos de funcionalidades
│       │   └── shared/                # Componentes compartidos
│       └── src/environments/          # Configuración de entornos
│
└── mobile-app/                        # Aplicación móvil (futuro)
```

---

## 🗄️ Base de Datos

### Migraciones de Entity Framework Core

El proyecto usa **Code-First** con Entity Framework Core.

#### Crear nueva migración:
```bash
cd backend-services/src/CondoFlow.Infrastructure
dotnet ef migrations add NombreMigracion --startup-project ../CondoFlow.WebApi
```

#### Aplicar migraciones:
```bash
dotnet ef database update --startup-project ../CondoFlow.WebApi
```

#### Revertir migración:
```bash
dotnet ef database update MigracionAnterior --startup-project ../CondoFlow.WebApi
```

### Datos Iniciales (Seeding)

Los datos iniciales se cargan automáticamente al iniciar la aplicación mediante `CatalogSeeder.cs`.

**Datos cargados automáticamente:**
- ✅ Roles (Admin, Owner)
- ✅ Categorías de Incidentes (6)
- ✅ Prioridades (4)
- ✅ Estados (5)
- ✅ Tipos de Eventos (12)
- ✅ Bloques (M, N, O, P, Q)
- ✅ Apartamentos (40 - 8 por bloque)
- ✅ Tipos de Anuncios (4)
- ✅ Conceptos de Pago (6)
- ✅ Categorías de Gastos (8)

**Para agregar nuevos datos iniciales:**
1. Editar `backend-services/src/CondoFlow.Infrastructure/Data/CatalogSeeder.cs`
2. Reiniciar la aplicación

---

## 🔧 Configuración

### Backend (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=CondoFlowDb;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=true;"
  },
  "Jwt": {
    "Key": "your-super-secret-key-at-least-32-characters",
    "Issuer": "CondoFlow",
    "Audience": "CondoFlow"
  },
  "Email": {
    "FromEmail": "your-email@gmail.com",
    "Password": "your-app-password",
    "FromName": "CondoFlow"
  }
}
```

### Frontend (environment.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:7009/api'
};
```

---

## 🔐 Autenticación y Autorización

### Roles:
- **Admin**: Acceso completo al sistema
- **Owner**: Acceso a funcionalidades de propietario

### Flujo de Registro:
1. Usuario se registra como Owner
2. Queda pendiente de aprobación (`IsApproved = false`)
3. Admin recibe notificación
4. Admin aprueba o rechaza el usuario
5. Usuario recibe notificación del resultado

### Endpoints de Autenticación:
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/refresh-token` - Renovar token
- `POST /api/auth/approve-user/{id}` - Aprobar usuario (Admin)
- `POST /api/auth/reject-user/{id}` - Rechazar usuario (Admin)

---

## 📡 Notificaciones en Tiempo Real

El sistema usa **SignalR** para notificaciones en tiempo real.

### Hub de Notificaciones:
- URL: `http://localhost:7009/notificationHub`
- Autenticación: JWT Token

### Tipos de Notificaciones:
- **UserRegistration**: Nuevo usuario registrado (Admin)
- **UserApproved**: Usuario aprobado (Owner)
- **UserRejected**: Usuario rechazado (Owner)
- **PaymentReceived**: Nuevo pago recibido (Admin)
- **PaymentApproved**: Pago aprobado (Owner)
- **PaymentRejected**: Pago rechazado (Owner)
- **DebtReminder**: Recordatorio de deuda (Owner)
- **DebtOverdue**: Deuda vencida (Owner)

---

## 🎨 Funcionalidades Principales

### Para Administradores:
- ✅ Gestión de usuarios (aprobar/rechazar)
- ✅ Gestión de anuncios
- ✅ Gestión de gastos
- ✅ Gestión de pagos (aprobar/rechazar)
- ✅ Gestión de deudas
- ✅ Gestión de incidentes
- ✅ Gestión de reservaciones
- ✅ Gestión de encuestas
- ✅ Gestión de proveedores
- ✅ Reportes financieros

### Para Propietarios:
- ✅ Ver anuncios
- ✅ Reportar incidentes
- ✅ Ver y pagar deudas
- ✅ Hacer reservaciones
- ✅ Participar en encuestas
- ✅ Ver historial de pagos
- ✅ Actualizar perfil

---

## 🧪 Testing

### Backend:
```bash
cd backend-services
dotnet test
```

### Frontend:
```bash
cd web-portal/condoflow-web
npm test
```

---

## 🐛 Troubleshooting

### Backend no inicia:
1. Verificar que SQL Server esté corriendo
2. Verificar connection string en appsettings.json
3. Verificar que el puerto 7009 esté disponible

### Frontend no carga datos:
1. Verificar que el backend esté corriendo
2. Abrir consola del navegador (F12) para ver errores
3. Verificar que `environment.apiUrl` apunte a `http://localhost:7009/api`

### Problemas con migraciones:
```bash
# Ver migraciones aplicadas
dotnet ef migrations list

# Revertir a migración específica
dotnet ef database update MigracionAnterior

# Eliminar última migración (si no se aplicó)
dotnet ef migrations remove
```

### Resetear base de datos:
```bash
# Eliminar base de datos
dotnet ef database drop

# Recrear con todas las migraciones
dotnet ef database update

# Los datos iniciales se cargan automáticamente al iniciar la app
```

---

## 📝 Mejores Prácticas

### ✅ Hacer:
- Usar migraciones para cambios de estructura
- Usar CatalogSeeder para datos iniciales
- Versionar todo con Git
- Documentar cambios importantes
- Probar antes de hacer commit

### ❌ No Hacer:
- Modificar migraciones ya aplicadas
- Crear scripts SQL manuales
- Agregar datos de ejemplo en migraciones
- Hardcodear URLs en el código
- Subir credenciales al repositorio

---

## 🔄 Workflow de Desarrollo

### 1. Crear nueva funcionalidad:
```bash
# Crear rama
git checkout -b feature/nueva-funcionalidad

# Desarrollar...

# Commit
git add .
git commit -m "feat: descripción de la funcionalidad"

# Push
git push origin feature/nueva-funcionalidad

# Crear Pull Request
```

### 2. Agregar nueva entidad:
```bash
# 1. Crear entidad en Domain
# 2. Agregar DbSet en ApplicationDbContext
# 3. Crear migración
dotnet ef migrations add AddNuevaEntidad

# 4. Aplicar migración
dotnet ef database update

# 5. Agregar seed si es necesario en CatalogSeeder
```

### 3. Agregar nuevo endpoint:
```bash
# 1. Crear DTO en Application/DTOs
# 2. Crear Controller en WebApi/Controllers
# 3. Agregar servicio en Infrastructure si es necesario
# 4. Probar con Swagger o Postman
```

---

## 📚 Recursos Adicionales

### Documentación:
- [Entity Framework Core](https://docs.microsoft.com/ef/core/)
- [ASP.NET Core](https://docs.microsoft.com/aspnet/core/)
- [Angular](https://angular.io/docs)
- [SignalR](https://docs.microsoft.com/aspnet/core/signalr/)
- [PrimeNG](https://primeng.org/)

### Herramientas Recomendadas:
- **IDE**: Visual Studio 2022 / VS Code
- **DB Manager**: SQL Server Management Studio / Azure Data Studio
- **API Testing**: Postman / Swagger
- **Git Client**: Git Bash / GitHub Desktop

---

## 🎉 Proyecto Limpio y Optimizado

Este proyecto ahora sigue las mejores prácticas de desarrollo:
- ✅ Código limpio y organizado
- ✅ Migraciones optimizadas
- ✅ Seeding automático
- ✅ Sin archivos SQL manuales
- ✅ Documentación completa
- ✅ Fácil de mantener y escalar

¡Listo para desarrollo y producción! 🚀

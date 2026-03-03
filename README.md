# CondoFlow - Sistema de Gestión de Condominios

Sistema completo de gestión de condominios con backend .NET 9.0 y frontend Angular 20.

## 🚀 Inicio Rápido

### Prerrequisitos
- .NET 9.0 SDK
- Node.js 18+ y npm
- SQL Server (Docker recomendado)
- Git

### Configuración Inicial

1. **Clonar el repositorio**
```bash
git clone https://github.com/yhancarloSPM/condoflow.git
cd condoflow
```

2. **Configurar Base de Datos**
```bash
# Iniciar SQL Server en Docker
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong!Passw0rd" -p 1433:1433 --name condoflow-sql -d mcr.microsoft.com/mssql/server:2022-latest

# Aplicar migraciones
cd backend-services/src/CondoFlow.WebApi
dotnet ef database update
```

3. **Iniciar Backend**
```bash
cd backend-services/src/CondoFlow.WebApi
dotnet run
# Backend disponible en: http://localhost:7009
```

4. **Iniciar Frontend**
```bash
cd web-portal/condoflow-web
npm install
npm start
# Frontend disponible en: http://localhost:4200
```

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
│   └── condoflow-web/                 # Aplicación Angular 20
│       ├── src/app/
│       │   ├── core/                  # Servicios, guards, interceptors
│       │   ├── features/              # Módulos de funcionalidades
│       │   └── shared/                # Componentes compartidos
│       └── src/environments/          # Configuración de entornos
│
└── mobile-app/                        # Aplicación móvil (futuro)
```

## 🛠️ Tecnologías

### Backend (.NET 9.0)
- **Framework**: ASP.NET Core 9.0
- **Base de datos**: SQL Server con Entity Framework Core
- **Autenticación**: JWT + ASP.NET Identity
- **Notificaciones**: SignalR
- **Arquitectura**: Clean Architecture

### Frontend (Angular 20)
- **Framework**: Angular 20 con Signals
- **UI**: PrimeNG + Bootstrap
- **Estilos**: SCSS
- **Estado**: Angular Signals

## ✨ Funcionalidades

### Para Administradores
- ✅ Gestión de usuarios (aprobar/rechazar registros)
- ✅ Gestión de anuncios
- ✅ Gestión de gastos y proveedores
- ✅ Gestión de pagos (aprobar/rechazar)
- ✅ Gestión de deudas
- ✅ Gestión de incidentes
- ✅ Gestión de reservaciones
- ✅ Gestión de encuestas
- ✅ Reportes financieros
- ✅ Generación automática de deudas anuales

### Para Propietarios
- ✅ Ver anuncios del condominio
- ✅ Reportar incidentes
- ✅ Ver y pagar deudas
- ✅ Hacer reservaciones de áreas comunes
- ✅ Participar en encuestas
- ✅ Ver historial de pagos
- ✅ Actualizar perfil
- ✅ Dashboard con estado de deudas

## 🗄️ Base de Datos

### Migraciones

El proyecto usa **Code-First** con Entity Framework Core.

```bash
# Crear nueva migración
cd backend-services/src/CondoFlow.Infrastructure
dotnet ef migrations add NombreMigracion --startup-project ../CondoFlow.WebApi

# Aplicar migraciones
dotnet ef database update --startup-project ../CondoFlow.WebApi

# Revertir migración
dotnet ef database update MigracionAnterior --startup-project ../CondoFlow.WebApi

# Ver migraciones aplicadas
dotnet ef migrations list --startup-project ../CondoFlow.WebApi
```

### Datos Iniciales (Seeding)

Los datos iniciales se cargan automáticamente al iniciar la aplicación mediante `CatalogSeeder.cs`:

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
    "Audience": "CondoFlowUsers"
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

## 🔐 Autenticación

### Roles
- **Admin**: Acceso completo al sistema
- **Owner**: Acceso a funcionalidades de propietario

### Flujo de Registro
1. Usuario se registra como Owner
2. Queda pendiente de aprobación (`IsApproved = false`)
3. Admin recibe notificación en tiempo real
4. Admin aprueba o rechaza el usuario
5. Usuario recibe notificación del resultado

## 📡 Notificaciones en Tiempo Real

El sistema usa **SignalR** para notificaciones en tiempo real:

- UserRegistration: Nuevo usuario registrado (Admin)
- UserApproved/Rejected: Estado de aprobación (Owner)
- PaymentReceived/Approved/Rejected: Estado de pagos
- DebtReminder/Overdue: Recordatorios de deudas

## 🤖 Servicios Automáticos

### Generación Anual de Deudas
- Se ejecuta automáticamente el 1 de enero a las 00:01 AM
- Genera las 12 deudas mensuales del año para todos los propietarios
- Calcula montos según tipo de apartamento (techo vs regular)
- Previene duplicados con validación de existencia

### Recordatorios de Deudas
- Envía recordatorios automáticos por email
- Notificaciones en tiempo real vía SignalR
- Alertas de deudas vencidas

## 🧪 Testing

### Backend
```bash
cd backend-services
dotnet test
```

### Frontend
```bash
cd web-portal/condoflow-web
npm test
```

## 🐛 Troubleshooting

### Backend no inicia
1. Verificar que SQL Server esté corriendo
2. Verificar connection string en appsettings.json
3. Verificar que el puerto 7009 esté disponible

### Frontend no carga datos
1. Verificar que el backend esté corriendo
2. Abrir consola del navegador (F12) para ver errores
3. Verificar que `environment.apiUrl` apunte a `http://localhost:7009/api`

### Resetear base de datos
```bash
# Eliminar base de datos
dotnet ef database drop --startup-project ../CondoFlow.WebApi

# Recrear con todas las migraciones
dotnet ef database update --startup-project ../CondoFlow.WebApi

# Los datos iniciales se cargan automáticamente al iniciar la app
```

## 📝 Mejores Prácticas

### ✅ Hacer
- Usar migraciones para cambios de estructura
- Usar CatalogSeeder para datos iniciales
- Usar conventional commits
- Documentar cambios importantes
- Probar antes de hacer commit

### ❌ No Hacer
- Modificar migraciones ya aplicadas
- Crear scripts SQL manuales
- Agregar datos de ejemplo en migraciones
- Hardcodear URLs en el código
- Subir credenciales al repositorio

## 🔄 Workflow de Desarrollo

### Conventional Commits
El proyecto usa conventional commits:

```bash
# Tipos de commits
feat: Nueva funcionalidad
fix: Corrección de bug
refactor: Refactorización de código
style: Cambios de formato
chore: Tareas de mantenimiento
docs: Cambios en documentación
test: Agregar o modificar tests

# Ejemplos
git commit -m "feat: add annual debt generation service"
git commit -m "fix: correct payment status categorization"
git commit -m "refactor: migrate from string to ID-based apartment references"
```

### Crear nueva funcionalidad
```bash
# Crear rama
git checkout -b feature/nueva-funcionalidad

# Desarrollar y hacer commits
git add .
git commit -m "feat: descripción de la funcionalidad"

# Push
git push origin feature/nueva-funcionalidad
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/refresh-token` - Renovar token

### Deudas
- `GET /api/owners/{ownerId}/debts` - Listar deudas del propietario
- `POST /api/admin/debts` - Crear deuda (Admin)
- `GET /api/admin/debts` - Listar todas las deudas (Admin)

### Pagos
- `POST /api/owners/{ownerId}/payments` - Crear pago
- `GET /api/owners/{ownerId}/payments` - Listar pagos del propietario
- `PUT /api/admin/payments/{id}/approve` - Aprobar pago (Admin)
- `PUT /api/admin/payments/{id}/reject` - Rechazar pago (Admin)

### Anuncios
- `GET /api/announcements` - Listar anuncios activos
- `POST /api/announcements` - Crear anuncio (Admin)
- `PUT /api/announcements/{id}` - Actualizar anuncio (Admin)
- `DELETE /api/announcements/{id}` - Eliminar anuncio (Admin)

### Incidentes
- `GET /api/incidents` - Listar incidentes
- `POST /api/incidents` - Crear incidente
- `PUT /api/incidents/{id}` - Actualizar incidente
- `PUT /api/incidents/{id}/status` - Cambiar estado (Admin)

### Reservaciones
- `GET /api/reservations` - Listar reservaciones
- `POST /api/reservations` - Crear reservación
- `PUT /api/reservations/{id}/approve` - Aprobar reservación (Admin)
- `PUT /api/reservations/{id}/reject` - Rechazar reservación (Admin)

### Encuestas
- `GET /api/polls` - Listar encuestas activas
- `POST /api/polls` - Crear encuesta (Admin)
- `POST /api/polls/{id}/vote` - Votar en encuesta
- `GET /api/polls/{id}/results` - Ver resultados

## 🎯 Estado del Proyecto

- ✅ Backend completamente funcional
- ✅ Frontend con todas las funcionalidades principales
- ✅ Autenticación y autorización
- ✅ Notificaciones en tiempo real
- ✅ Generación automática de deudas
- ✅ Gestión completa de pagos
- ✅ Sistema de encuestas
- ✅ Gestión de incidentes y reservaciones
- ✅ Dashboard para propietarios y administradores

## 📄 Licencia

Este proyecto es privado y confidencial.

## 👥 Contribuidores

- Equipo de desarrollo CondoFlow

---

**CondoFlow** - Sistema profesional de gestión de condominios 🏢
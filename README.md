# CondoFlow - Sistema de Gestión de Condominios

Monorepo para el sistema completo de gestión de condominios CondoFlow.

## Estructura del Proyecto

```
CondoFlow/
├── backend-services/          # Backend .NET 9.0
│   ├── src/
│   │   ├── CondoFlow.Domain/      # Entidades y lógica de negocio
│   │   ├── CondoFlow.Application/ # Casos de uso y DTOs
│   │   ├── CondoFlow.Infrastructure/ # Persistencia y servicios externos
│   │   └── CondoFlow.WebApi/      # API REST
│   ├── tests/                     # Tests del backend
│   └── CondoFlow.sln
├── web-portal/                # Frontend Angular 20
│   └── condoflow-web/         # Portal web con PrimeNG + Bootstrap
├── mobile-app/                # App móvil React Native (futuro)
├── shared-libs/               # Librerías y código compartido
└── docs/                      # Documentación
```

## Tecnologías

### Backend (.NET 9.0)
- **Framework**: ASP.NET Core 9.0
- **Base de datos**: SQL Server con Entity Framework Core
- **Autenticación**: JWT + ASP.NET Identity
- **Arquitectura**: Hexagonal/Clean Architecture

### Frontend (Angular 20)
- **Framework**: Angular 20 con Signals y Computed
- **UI**: PrimeNG + Bootstrap
- **Estilos**: SCSS
- **Estado**: Angular Signals

### Móvil (React Native)
- **Framework**: React Native (futuro)

## Funcionalidades Implementadas

### ✅ Backend
- Autenticación y autorización (JWT, Roles: Admin/Owner)
- Gestión de deudas (CRUD)
- Gestión de pagos con comprobantes
- Subida de archivos (multipart + base64)
- Validaciones de negocio
- Respuestas estandarizadas en español
- Tests unitarios

### 🚧 Frontend
- Proyecto Angular 20 creado
- PrimeNG y Bootstrap configurados

## Desarrollo

### Backend
```bash
cd backend-services/src/CondoFlow.WebApi
dotnet run
```

### Frontend
```bash
cd web-portal/condoflow-web
npm start
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/refresh-token` - Renovar token

### Deudas (Admin)
- `POST /api/owners/{ownerId}/debts` - Crear deuda
- `GET /api/owners/{ownerId}/debts` - Listar deudas

### Pagos (Owner)
- `POST /api/owners/{ownerId}/payments` - Crear pago
- `GET /api/owners/{ownerId}/payments` - Listar pagos

## Próximos Pasos

1. **Frontend Angular**: Implementar componentes principales
2. **Job mensual**: Generación automática de deudas
3. **App móvil**: React Native
4. **Funcionalidades adicionales**: Incidencias, Reservas, etc.
# CondoFlow - Backend Architecture Guidelines

## 🏗️ Clean Architecture Overview

Este proyecto sigue **Clean Architecture** con las siguientes capas:

```
Domain (núcleo, sin dependencias)
  ↑
Application (lógica de negocio, depende solo de Domain)
  ↑
Infrastructure (implementaciones, depende de Application y Domain)
  ↑
WebApi (presentación, depende de Application)
```

---

## 📁 Estructura de Capas

### Domain Layer (`CondoFlow.Domain`)

**Responsabilidad**: Entidades de negocio, reglas de dominio, value objects  
**Dependencias**: NINGUNA (núcleo puro)

```
Domain/
├── Entities/          # Entidades del dominio
├── ValueObjects/      # Objetos de valor (Money, etc.)
├── Enums/            # Enumeraciones
└── Helpers/          # Helpers del dominio
```

**Reglas**:
- ❌ NO puede referenciar ninguna otra capa
- ❌ NO puede tener dependencias de frameworks
- ✅ Solo lógica de negocio pura
- ✅ Entidades con comportamiento

---

### Application Layer (`CondoFlow.Application`)

**Responsabilidad**: Casos de uso, lógica de negocio, interfaces  
**Dependencias**: Solo Domain

```
Application/
├── Interfaces/
│   ├── Repositories/  # Contratos de repositorios
│   └── Services/      # Contratos de servicios
├── Services/          # Implementación de lógica de negocio
├── DTOs/              # Data Transfer Objects
├── Mappings/          # AutoMapper profiles
└── Common/
    ├── DTOs/          # DTOs compartidos
    ├── Models/        # Modelos compartidos
    └── Services/      # Interfaces de servicios comunes
```

**Reglas**:
- ❌ NO puede referenciar Infrastructure
- ❌ NO puede usar DbContext directamente
- ❌ NO puede usar UserManager directamente
- ✅ Solo usa interfaces (IRepository, IService)
- ✅ Contiene toda la lógica de negocio
- ✅ Define los contratos que Infrastructure implementa

---

### Infrastructure Layer (`CondoFlow.Infrastructure`)

**Responsabilidad**: Implementaciones de persistencia, servicios externos  
**Dependencias**: Application, Domain

```
Infrastructure/
├── Data/
│   ├── ApplicationDbContext.cs
│   └── CatalogSeeder.cs
├── Repositories/      # Implementaciones de IRepository
├── Services/          # Servicios de infraestructura
├── Identity/
│   ├── ApplicationUser.cs
│   └── JwtService.cs
└── Migrations/        # Migraciones de EF Core
```

**Reglas**:
- ✅ Implementa las interfaces definidas en Application
- ✅ Usa DbContext (ApplicationDbContext)
- ✅ Usa UserManager (a través de IdentityService)
- ❌ NO contiene lógica de negocio

---

### WebApi Layer (`CondoFlow.WebApi`)

**Responsabilidad**: Endpoints HTTP, validación de entrada  
**Dependencias**: Application

```
WebApi/
├── Controllers/       # Endpoints de la API
├── DTOs/             # DTOs específicos de la API
├── Middleware/       # Middleware personalizado
├── Services/         # Servicios específicos de WebApi
├── Hubs/             # SignalR hubs
└── Program.cs        # Configuración
```

**Reglas**:
- ❌ NO puede referenciar Infrastructure directamente
- ❌ NO puede usar DbContext
- ❌ NO puede usar repositorios directamente
- ✅ Solo inyecta interfaces de servicios
- ✅ Solo coordina y delega a Application

---

## 🎯 Reglas de Dependencia (CRÍTICO)

### ✅ Dependencias Permitidas:
```
WebApi → Application
Infrastructure → Application → Domain
```

### ❌ Dependencias PROHIBIDAS:
```
Application → Infrastructure  (NUNCA)
Application → WebApi         (NUNCA)
Domain → cualquier capa      (NUNCA)
```

---

## 🔧 Cómo Implementar Nuevas Features

### 1. Agregar una nueva entidad
```
1. Crear entidad en Domain/Entities/
2. Agregar al DbContext en Infrastructure/Data/
3. Crear migración
```

### 2. Agregar un nuevo repositorio
```
1. Crear interfaz en Application/Interfaces/Repositories/
2. Implementar en Infrastructure/Repositories/
3. Registrar en Program.cs
```

### 3. Agregar un nuevo servicio de negocio
```
1. Crear interfaz en Application/Interfaces/Services/
2. Implementar en Application/Services/ (usa solo interfaces)
3. Registrar en Program.cs
```

### 4. Agregar un servicio de infraestructura
```
1. Crear interfaz en Application/Interfaces/Services/
2. Implementar en Infrastructure/Services/
3. Registrar en Program.cs
```

### 5. Agregar un nuevo endpoint
```
1. Crear controller en WebApi/Controllers/
2. Inyectar solo interfaces de servicios
3. NO inyectar DbContext, UserManager, o repositorios
```

---

## 🚫 Anti-Patterns a Evitar

### ❌ NO HACER:

```csharp
// En Application/Services/
public class DebtService {
    private readonly ApplicationDbContext _context; // ❌ MAL
    private readonly UserManager<ApplicationUser> _userManager; // ❌ MAL
}

// En Controllers/
public class DebtsController {
    private readonly ApplicationDbContext _context; // ❌ MAL
    private readonly IDebtRepository _debtRepository; // ❌ MAL (usar servicio)
}

// Application referenciando Infrastructure
using CondoFlow.Infrastructure.Data; // ❌ MAL

// Valores hardcodeados
public class DebtService {
    public decimal CalculateAmount() {
        var amount = apartment.Number == "501" ? 1000 : 2000; // ❌ MAL
        return amount;
    }
}

// Strings hardcodeados
public class IncidentService {
    public void UpdateStatus() {
        incident.Status = "in_progress"; // ❌ MAL
    }
}
```

### ✅ HACER:

```csharp
// En Application/Services/
public class DebtService {
    private readonly IDebtRepository _debtRepository; // ✅ BIEN
    private readonly IUserRepository _userRepository; // ✅ BIEN
    private readonly DebtConfiguration _debtConfig; // ✅ BIEN
}

// En Infrastructure/Repositories/
public class DebtRepository {
    private readonly ApplicationDbContext _context; // ✅ BIEN
}

// En Controllers/
public class DebtsController {
    private readonly IDebtService _debtService; // ✅ BIEN
}

// Uso de configuración
public class DebtService {
    public decimal CalculateAmount() {
        var isRoof = _debtConfig.RoofApartmentNumbers.Contains(apartment.Number);
        var amount = isRoof ? _debtConfig.RoofApartmentAmount : _debtConfig.DefaultAmount;
        return amount;
    }
}

// Uso de constantes/enums
public class IncidentService {
    public void UpdateStatus() {
        incident.Status = StatusCodes.InProgress; // ✅ BIEN
    }
}
```

---

## 📝 Registro de Servicios en Program.cs

### Orden de registro:

```csharp
// 1. Repositorios (Infrastructure)
builder.Services.AddScoped<IXRepository, XRepository>();

// 2. Servicios de Infrastructure
builder.Services.AddScoped<IIdentityService, IdentityService>();
builder.Services.AddHostedService<BackgroundService>();

// 3. Servicios de Application (lógica de negocio)
builder.Services.AddScoped<IXService, Application.Services.XService>();
```

---

## 📚 Servicios Actuales

### Application Services (Lógica de Negocio):
- AuthService
- UserService
- OwnerService
- DebtService
- IncidentService
- ProviderService
- ExpenseService
- PollService
- AnnouncementService
- ReservationService

### Infrastructure Services:
- IdentityService (abstrae UserManager)
- GmailService
- TelegramService
- DebtReminderService
- MonthlyDebtGenerationService
- DebtReminderBackgroundService
- LocalizationService
- NotificationService

---

## 🎓 Principios de Diseño

### SOLID
- **S**ingle Responsibility
- **O**pen/Closed
- **L**iskov Substitution
- **I**nterface Segregation
- **D**ependency Inversion

### YAGNI (You Aren't Gonna Need It)
- No implementar funcionalidad hasta que sea necesaria
- Evitar código especulativo
- Mantener el código simple

### KISS (Keep It Simple, Stupid)
- Preferir soluciones simples
- Evitar sobre-ingeniería
- Código fácil de entender

### DRY (Don't Repeat Yourself)
- No duplicar lógica
- Extraer código común
- Usar helpers y servicios compartidos
- Usar enums y constantes

---

## ✅ Checklist para Code Review

- [ ] ¿Application tiene alguna referencia a Infrastructure? → ❌ Rechazar
- [ ] ¿Los servicios en Application usan DbContext directamente? → ❌ Rechazar
- [ ] ¿Los controllers inyectan DbContext o repositorios? → ❌ Rechazar
- [ ] ¿Las interfaces están en Application? → ✅ Aprobar
- [ ] ¿Las implementaciones están en Infrastructure? → ✅ Aprobar
- [ ] ¿Los servicios de negocio están en Application/Services? → ✅ Aprobar
- [ ] ¿Los servicios usan solo interfaces? → ✅ Aprobar

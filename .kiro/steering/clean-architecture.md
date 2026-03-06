---
inclusion: always
---

# CondoFlow - Clean Architecture Guidelines

## 📚 Guías del Proyecto

Este proyecto tiene múltiples steering files organizados por tema:

- **clean-architecture.md** (este archivo) - Resumen general y enlaces
- **backend-architecture.md** - Arquitectura del backend (capas, dependencias, servicios)
- **frontend-styles.md** - Sistema de estilos y colores del frontend
- **automapper-conventions.md** - AutoMapper y convenciones de nombres

---

## 🏗️ Arquitectura del Proyecto

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

**Para detalles completos sobre la arquitectura del backend, ver `backend-architecture.md`**

---

## 🎨 Frontend - Sistema de Estilos

### Estructura de Archivos SCSS

```
web-portal/condoflow-web/src/styles/
├── styles.scss           # Archivo principal (importa todo)
├── _variables.scss       # Variables globales (FUENTE ÚNICA DE VERDAD)
└── _badges.scss          # Mixins para badges (usa variables)
```

### Orden de Importación (CRÍTICO)

```scss
/* 1. Variables PRIMERO (fuente única de verdad) */
@import 'styles/variables';

/* 2. Badges DESPUÉS (usa las variables) */
@import 'styles/badges';
```

**Para detalles completos sobre estilos y colores, ver `frontend-styles.md`**

---

## 🗺️ AutoMapper y Convenciones

### AutoMapper
- Todos los mapeos en `Application/Mappings/MappingProfile.cs`
- Inyectar `IMapper` en servicios de Application
- Usar AutoMapper en lugar de mapeo manual

### Naming Conventions
- Clases: `PascalCase`
- Interfaces: `I` + `PascalCase`
- Métodos async: `PascalCase` + `Async`
- Campos privados: `_camelCase`
- Variables locales: `camelCase`

**Para detalles completos sobre AutoMapper y naming, ver `automapper-conventions.md`**

---

## 📁 Resumen de Capas

### Domain Layer (`CondoFlow.Domain`)
- **Responsabilidad**: Entidades de negocio, reglas de dominio
- **Dependencias**: NINGUNA
- ❌ NO puede referenciar ninguna otra capa

### Application Layer (`CondoFlow.Application`)
- **Responsabilidad**: Lógica de negocio, interfaces
- **Dependencias**: Solo Domain
- ❌ NO puede referenciar Infrastructure
- ✅ Define contratos (interfaces) que Infrastructure implementa

### Infrastructure Layer (`CondoFlow.Infrastructure`)
- **Responsabilidad**: Persistencia, servicios externos
- **Dependencias**: Application, Domain
- ✅ Implementa interfaces de Application
- ❌ NO contiene lógica de negocio

### WebApi Layer (`CondoFlow.WebApi`)
- **Responsabilidad**: Endpoints HTTP
- **Dependencias**: Application
- ❌ NO puede referenciar Infrastructure
- ✅ Solo inyecta interfaces de servicios

**Para estructura detallada de cada capa, ver `backend-architecture.md`**

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
3. Registrar en Program.cs: builder.Services.AddScoped<IXRepository, XRepository>()
```

### 3. Agregar un nuevo servicio de negocio
```
1. Crear interfaz en Application/Interfaces/Services/
2. Implementar en Application/Services/ (usa solo interfaces)
3. Registrar en Program.cs: builder.Services.AddScoped<IXService, XService>()
```

### 4. Agregar un servicio de infraestructura (API externa, etc.)
```
1. Crear interfaz en Application/Interfaces/Services/
2. Implementar en Infrastructure/Services/
3. Registrar en Program.cs
```

### 5. Agregar un nuevo endpoint
```
1. Crear controller en WebApi/Controllers/
2. Inyectar solo interfaces de servicios (IXService)
3. NO inyectar DbContext, UserManager, o repositorios
```

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

// Valores hardcodeados en el código
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
    private readonly DebtConfiguration _debtConfig; // ✅ BIEN (configuración)
    
    public DebtService(
        IDebtRepository debtRepository,
        IUserRepository userRepository,
        IOptions<DebtConfiguration> debtConfig)
    {
        _debtRepository = debtRepository;
        _userRepository = userRepository;
        _debtConfig = debtConfig.Value;
    }
}

// En Infrastructure/Repositories/
public class DebtRepository {
    private readonly ApplicationDbContext _context; // ✅ BIEN
}

// En Controllers/
public class DebtsController {
    private readonly IDebtService _debtService; // ✅ BIEN
}

// Configuración en appsettings.json
{
  "DebtConfiguration": {
    "DefaultAmount": 2000,
    "RoofApartmentAmount": 1000,
    "RoofApartmentNumbers": ["501", "502"]
  }
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

## 📝 Registro de Servicios en Program.cs

### Orden de registro:
```csharp
// 1. Repositorios (Infrastructure)
builder.Services.AddScoped<IXRepository, XRepository>();

// 2. Servicios de Infrastructure (Identity, APIs externas, Background)
builder.Services.AddScoped<IIdentityService, IdentityService>();
builder.Services.AddHostedService<BackgroundService>();

// 3. Servicios de Application (lógica de negocio)
builder.Services.AddScoped<IXService, Application.Services.XService>();
```

## 🧪 Testing

Con esta arquitectura, los tests son más fáciles:

```csharp
// Test de DebtService (sin base de datos)
var mockDebtRepo = new Mock<IDebtRepository>();
var mockUserRepo = new Mock<IUserRepository>();
var service = new DebtService(mockDebtRepo.Object, mockUserRepo.Object);
```

## 🔍 Checklist para Code Review

Antes de hacer commit, verificar:

- [ ] ¿Application tiene alguna referencia a Infrastructure? → ❌ Rechazar
- [ ] ¿Los servicios en Application usan DbContext directamente? → ❌ Rechazar
- [ ] ¿Los controllers inyectan DbContext o repositorios? → ❌ Rechazar
- [ ] ¿Las interfaces están en Application? → ✅ Aprobar
- [ ] ¿Las implementaciones están en Infrastructure? → ✅ Aprobar
- [ ] ¿Los servicios de negocio están en Application/Services? → ✅ Aprobar
- [ ] ¿Los servicios usan solo interfaces? → ✅ Aprobar

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

### Infrastructure Services (Infraestructura):
- IdentityService (abstrae UserManager)
- GmailService
- TelegramService
- DebtReminderService
- MonthlyDebtGenerationService
- DebtReminderBackgroundService
- LocalizationService
- NotificationService

## 🎓 Principios de Diseño Aplicados

### SOLID
- **S**ingle Responsibility: Cada clase tiene una responsabilidad
- **O**pen/Closed: Abierto a extensión, cerrado a modificación
- **L**iskov Substitution: Las implementaciones son intercambiables
- **I**nterface Segregation: Interfaces específicas, no genéricas
- **D**ependency Inversion: Dependemos de abstracciones, no de concreciones

### YAGNI (You Aren't Gonna Need It)
- No implementar funcionalidad hasta que sea realmente necesaria
- Evitar código especulativo "por si acaso"
- Mantener el código simple y enfocado en los requisitos actuales
- Si no hay un caso de uso concreto, no lo construyas

**Ejemplo**:
```csharp
// ❌ MAL - Agregando funcionalidad que no se necesita
public interface IDebtRepository {
    Task<Debt> GetByIdAsync(int id);
    Task<Debt> GetByCodeAsync(string code); // No se usa en ningún lado
    Task<List<Debt>> GetByColorAsync(string color); // Especulativo
}

// ✅ BIEN - Solo lo que realmente se necesita
public interface IDebtRepository {
    Task<Debt> GetByIdAsync(int id);
    Task<List<Debt>> GetByOwnerIdAsync(int ownerId); // Se usa en el sistema
}
```

### KISS (Keep It Simple, Stupid)
- Preferir soluciones simples sobre complejas
- Evitar sobre-ingeniería
- El código debe ser fácil de entender y mantener
- Si hay dos formas de hacer algo, elegir la más simple

**Ejemplo**:
```csharp
// ❌ MAL - Sobre-ingeniería
public class DebtCalculationStrategyFactory {
    public IDebtCalculationStrategy CreateStrategy(DebtType type) {
        return type switch {
            DebtType.Monthly => new MonthlyDebtCalculationStrategy(),
            _ => throw new NotImplementedException()
        };
    }
}

// ✅ BIEN - Simple y directo (si solo hay un tipo)
public class DebtService {
    public decimal CalculateDebt(decimal amount) {
        return amount; // Simple cuando no hay complejidad real
    }
}
```

### DRY (Don't Repeat Yourself)
- No duplicar lógica en múltiples lugares
- Extraer código común a métodos/clases reutilizables
- Un cambio en la lógica debe hacerse en un solo lugar
- Usar helpers, servicios compartidos, y métodos de extensión
- Usar enums y constantes en lugar de strings hardcodeados

**Ejemplo**:
```csharp
// ❌ MAL - Código duplicado
public class DebtService {
    public async Task<Debt> CreateDebt(...) {
        var monthName = month switch {
            1 => "Enero", 2 => "Febrero", 3 => "Marzo", ...
        };
    }
}

public class MonthlyDebtService {
    public async Task GenerateDebts(...) {
        var monthName = month switch {
            1 => "Enero", 2 => "Febrero", 3 => "Marzo", ...
        };
    }
}

// ❌ MAL - Strings hardcodeados
public class IncidentService {
    public void UpdateStatus() {
        incident.Status = "in_progress"; // ❌ String hardcodeado
    }
}

// ✅ BIEN - Centralizado en un helper
public static class DateHelper {
    public static string GetMonthName(int month) {
        return CultureInfo.GetCultureInfo("es-ES")
            .DateTimeFormat.GetMonthName(month);
    }
}

// ✅ BIEN - Usando constantes/enums
public static class StatusCodes {
    public const string Reported = "reported";
    public const string InProgress = "in_progress";
    public const string Resolved = "resolved";
}

public class IncidentService {
    public void UpdateStatus() {
        incident.Status = StatusCodes.InProgress; // ✅ Constante
    }
}

// Ambos servicios usan el helper
var monthName = DateHelper.GetMonthName(month);
```

**Aplicaciones en el proyecto**:
- `DateHelper.GetMonthName()` - Evita duplicar lógica de nombres de meses
- Enums (`StatusCodes`, `PaymentConceptCodes`, `PollStatus`) - Evita strings hardcodeados repetidos
- Interfaces compartidas - Evita duplicar contratos
- Servicios base - Evita duplicar lógica común

## 🗺️ AutoMapper - Mapeo de Objetos

### ¿Por qué usar AutoMapper?
- Elimina código repetitivo de mapeo manual entre entidades y DTOs
- Reduce errores al copiar propiedades
- Facilita el mantenimiento cuando cambian las estructuras
- Hace el código más limpio y legible

### Estructura en el Proyecto

```
Application/
├── Mappings/
│   └── MappingProfile.cs    # Configuración de todos los mapeos
└── DTOs/                    # Data Transfer Objects
    ├── DebtDto.cs
    ├── PaymentDto.cs
    ├── IncidentDto.cs
    ├── ExpenseDto.cs
    └── ...
```

### Configuración

**En Program.cs**:
```csharp
// Registrar AutoMapper
builder.Services.AddAutoMapper(typeof(CondoFlow.Application.Mappings.MappingProfile));
```

**En MappingProfile.cs**:
```csharp
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Mapeo simple (propiedades con mismo nombre)
        CreateMap<Provider, ProviderDto>();
        
        // Mapeo con configuración personalizada
        CreateMap<Payment, PaymentDto>()
            .ForMember(dest => dest.OwnerName, 
                opt => opt.MapFrom(src => src.Owner != null ? src.Owner.Name : string.Empty))
            .ForMember(dest => dest.StatusName, 
                opt => opt.MapFrom(src => src.Status != null ? src.Status.Name : string.Empty));
    }
}
```

### Uso en Servicios

**❌ MAL - Mapeo manual**:
```csharp
public async Task<List<PaymentDto>> GetPayments()
{
    var payments = await _paymentRepository.GetAllAsync();
    
    var dtos = new List<PaymentDto>();
    foreach (var payment in payments)
    {
        dtos.Add(new PaymentDto
        {
            Id = payment.Id,
            OwnerId = payment.OwnerId,
            OwnerName = payment.Owner?.Name ?? string.Empty,
            Amount = payment.Amount,
            PaymentDate = payment.PaymentDate,
            StatusId = payment.StatusId,
            StatusName = payment.Status?.Name ?? string.Empty,
            // ... más propiedades
        });
    }
    return dtos;
}
```

**✅ BIEN - Con AutoMapper**:
```csharp
public class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _paymentRepository;
    private readonly IMapper _mapper;
    
    public PaymentService(IPaymentRepository paymentRepository, IMapper mapper)
    {
        _paymentRepository = paymentRepository;
        _mapper = mapper;
    }
    
    public async Task<List<PaymentDto>> GetPayments()
    {
        var payments = await _paymentRepository.GetAllAsync();
        return _mapper.Map<List<PaymentDto>>(payments);
    }
    
    public async Task<PaymentDto> GetPaymentById(int id)
    {
        var payment = await _paymentRepository.GetByIdAsync(id);
        return _mapper.Map<PaymentDto>(payment);
    }
}
```

### Casos de Uso Comunes

**1. Mapeo de lista**:
```csharp
var entities = await _repository.GetAllAsync();
var dtos = _mapper.Map<List<EntityDto>>(entities);
```

**2. Mapeo de objeto único**:
```csharp
var entity = await _repository.GetByIdAsync(id);
var dto = _mapper.Map<EntityDto>(entity);
```

**3. Mapeo inverso (DTO → Entity)**:
```csharp
CreateMap<CreateProviderDto, Provider>();

// En el servicio
var provider = _mapper.Map<Provider>(createDto);
await _repository.AddAsync(provider);
```

**4. Actualizar entidad existente**:
```csharp
var entity = await _repository.GetByIdAsync(id);
_mapper.Map(updateDto, entity); // Actualiza entity con valores de updateDto
await _repository.UpdateAsync(entity);
```

### Reglas de AutoMapper en el Proyecto

- ✅ Todos los mapeos deben estar en `Application/Mappings/MappingProfile.cs`
- ✅ Inyectar `IMapper` en servicios de Application que necesiten mapeo
- ✅ Usar AutoMapper para mapear entre Entities y DTOs
- ✅ Configurar mapeos personalizados para propiedades de navegación
- ❌ NO usar AutoMapper en Infrastructure (solo en Application)
- ❌ NO hacer mapeo manual cuando AutoMapper puede hacerlo
- ❌ NO crear múltiples perfiles sin razón (mantener todo en MappingProfile)

### Beneficios en Clean Architecture

- **Separation of Concerns**: DTOs en Application, Entities en Domain
- **Testability**: Fácil mockear IMapper en tests
- **Maintainability**: Cambios en estructura se reflejan en un solo lugar
- **DRY**: No repetir código de mapeo en múltiples servicios

## 📝 Convenciones de Nombres (Naming Conventions)

### Reglas Generales

**Clases** → `PascalCase`
```csharp
DebtService, PaymentRepository, IncidentDto
```

**Interfaces** → `I` + `PascalCase`
```csharp
IDebtService, IPaymentRepository, IIdentityService
```

**Métodos** → `PascalCase`
```csharp
GetDebtById, CreatePayment, UpdateIncident
```

**Métodos async** → `PascalCase` + `Async`
```csharp
GetDebtByIdAsync, CreatePaymentAsync, UpdateIncidentAsync
```

**Variables locales** → `camelCase`
```csharp
var debtService = ...;
var paymentRepository = ...;
var ownerDto = ...;
```

**Propiedades** → `PascalCase`
```csharp
public string FirstName { get; set; }
public DateTime CreatedAt { get; set; }
public decimal Amount { get; set; }
```

**Campos privados** → `_camelCase`
```csharp
private readonly IDebtRepository _debtRepository;
private readonly IMapper _mapper;
private readonly ILogger<DebtService> _logger;
```

**Constantes** → `PascalCase`
```csharp
public const int MaxRetryCount = 3;
public const int DefaultPageSize = 20;
public const string DefaultCurrency = "DOP";
```

### Sufijos Específicos

**DTOs** → terminar en `Dto`
```csharp
DebtDto, PaymentDto, IncidentDto
CreateDebtDto, UpdatePaymentDto
```

**Servicios** → terminar en `Service`
```csharp
// Application Services (lógica de negocio)
DebtService, PaymentService, IncidentService

// Infrastructure Services (infraestructura)
IdentityService, GmailService, TelegramService
```

**Repositorios** → terminar en `Repository`
```csharp
DebtRepository, PaymentRepository, IncidentRepository
UserRepository, ApartmentRepository
```

**Controladores** → terminar en `Controller`
```csharp
DebtsController, PaymentsController, IncidentsController
AuthController, UsersController
```

**Archivos** → mismo nombre de la clase
```csharp
DebtService.cs
IDebtRepository.cs
PaymentDto.cs
DebtsController.cs
```

**Enums** → `PascalCase` (singular)
```csharp
public enum StatusCodes
{
    Pending,
    Confirmed,
    Paid,
    Rejected,
    Cancelled
}

public enum PaymentConceptCodes
{
    Maintenance,
    Advance,
    DebtPayment
}
```

### Ejemplos del Proyecto

**✅ BIEN**:
```csharp
// Servicio con dependencias
public class DebtService : IDebtService
{
    private readonly IDebtRepository _debtRepository;
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;
    
    public async Task<DebtDto> GetDebtByIdAsync(int debtId)
    {
        var debt = await _debtRepository.GetByIdAsync(debtId);
        return _mapper.Map<DebtDto>(debt);
    }
}

// Repositorio
public class PaymentRepository : IPaymentRepository
{
    private readonly ApplicationDbContext _context;
    
    public async Task<Payment> GetByIdAsync(int paymentId)
    {
        return await _context.Payments.FindAsync(paymentId);
    }
}

// Controller
public class DebtsController : ControllerBase
{
    private readonly IDebtService _debtService;
    
    [HttpGet("{id}")]
    public async Task<ActionResult<DebtDto>> GetDebt(int id)
    {
        var debtDto = await _debtService.GetDebtByIdAsync(id);
        return Ok(debtDto);
    }
}
```

**❌ MAL**:
```csharp
// Nombres inconsistentes
public class debt_service { } // ❌ snake_case
public class DEBTSERVICE { } // ❌ UPPERCASE
public interface DebtService { } // ❌ falta prefijo I
public class DebtDto { } // ❌ archivo: debt.cs (no coincide)

// Campos sin guión bajo
public class DebtService
{
    private IDebtRepository debtRepository; // ❌ falta _
    private IMapper Mapper; // ❌ PascalCase en campo privado
}

// Métodos async sin sufijo
public async Task<Debt> GetDebt(int id) { } // ❌ falta Async

// Variables con PascalCase
var DebtService = ...; // ❌ debe ser camelCase
var Payment_Dto = ...; // ❌ snake_case
```

### Regla de Oro

**Los nombres deben explicar claramente qué hace el elemento, sin abreviaciones confusas.**

```csharp
// ✅ BIEN - Nombres descriptivos
GetDebtsByOwnerId
CreateMonthlyDebtForAllOwners
SendPaymentConfirmationEmail

// ❌ MAL - Abreviaciones confusas
GetDbtsByOId
CrtMnthlyDbt
SndPmtConfEmail
```

---

**IMPORTANTE**: Este documento es la guía arquitectónica del proyecto. Cualquier cambio que viole estas reglas debe ser rechazado o refactorizado.

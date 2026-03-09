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

## 📦 DTOs vs Entities: Separación de Responsabilidades

### ¿Qué es una Entity (Domain)?

**Ubicación**: `Domain/Entities/`

```csharp
public class Announcement : BaseEntity
{
    public string Title { get; set; }
    public string Content { get; set; }
    public bool IsUrgent { get; set; }
    public DateTime? EventDate { get; set; }
    public string CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Relaciones con otras entidades
    public AnnouncementType? Type { get; set; }
    public int? TypeId { get; set; }
    
    // Propiedades de base de datos
    public bool IsActive { get; set; }
}
```

**Propósito**:
- Representa la estructura de la tabla en la base de datos
- Contiene lógica de negocio del dominio
- Tiene relaciones con otras entidades (navegación)
- Incluye propiedades técnicas (CreatedAt, IsActive, etc.)
- **NO debe salir de la capa de Infrastructure/Application**

---

### ¿Qué es un DTO (Application)?

**Ubicación**: `Application/DTOs/` o `Application/Common/DTOs/`

#### 1. DTO de Lectura (Response)
```csharp
public class AnnouncementDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Content { get; set; }
    public bool IsUrgent { get; set; }
    public DateTime? EventDate { get; set; }
    public string CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Propiedades "aplanadas" para el frontend
    public string TypeName { get; set; }  // En lugar de objeto Type completo
    public int? TypeId { get; set; }
}
```

#### 2. DTO de Creación (Request)
```csharp
public class CreateAnnouncementDto
{
    [Required(ErrorMessage = "El título es requerido")]
    [MaxLength(200)]
    public string Title { get; set; }
    
    [Required(ErrorMessage = "El contenido es requerido")]
    public string Content { get; set; }
    
    public bool IsUrgent { get; set; }
    
    public DateTime? EventDate { get; set; }
    
    public int? TypeId { get; set; }
    
    // NO incluye: Id, CreatedAt, CreatedBy (autogenerados)
}
```

#### 3. DTO de Actualización (Request)
```csharp
public class UpdateAnnouncementDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; }
    
    [Required]
    public string Content { get; set; }
    
    public bool IsUrgent { get; set; }
    
    public DateTime? EventDate { get; set; }
    
    public int? TypeId { get; set; }
}
```

**Propósito**:
- Representa los datos que se transfieren por la API
- Solo contiene lo que el cliente necesita ver/enviar
- Propiedades "aplanadas" (sin relaciones complejas)
- Incluye validaciones (Data Annotations)
- **Es lo que viaja por la API**

---

### 🔄 Flujo de Datos

```
Frontend (Angular)
    ↓ POST /api/announcements
    ↓ CreateAnnouncementDto
    
WebApi (Controller)
    ↓ Valida y pasa al servicio
    
Application (Service)
    ↓ CreateAnnouncementDto → Announcement (Entity)
    ↓ Usa AutoMapper o mapeo manual
    
Infrastructure (Repository)
    ↓ Guarda Announcement en DB
    ↓ Retorna Announcement
    
Application (Service)
    ↓ Announcement → AnnouncementDto
    ↓ Usa AutoMapper
    
WebApi (Controller)
    ↓ Retorna ApiResponse<AnnouncementDto>
    
Frontend (Angular)
    ↓ Recibe AnnouncementDto
```

---

### 🎯 Beneficios de DTOs

| Aspecto | Entity (Domain) | DTO (Application) |
|---------|----------------|-------------------|
| **Ubicación** | Domain/Entities | Application/DTOs |
| **Propósito** | Modelo de base de datos | Transferencia de datos |
| **Relaciones** | Sí (navegación) | No (aplanadas) |
| **Validaciones** | Reglas de negocio | Data Annotations |
| **Expuesto** | NO (interno) | SÍ (API) |
| **Mapeo** | Con AutoMapper | Desde/hacia Entity |

---

## 🚫 Anti-Patterns a Evitar

### ❌ ANTI-PATTERN #1: Múltiples Parámetros Primitivos

**Problema**: Métodos con muchos parámetros son difíciles de mantener y propensos a errores.

```csharp
// ❌ MAL - Demasiados parámetros
public async Task<AnnouncementDto> CreateAnnouncementAsync(
    string title, 
    string content, 
    bool isUrgent, 
    string createdBy, 
    DateTime? eventDate,
    int? typeId)
{
    // ...
}

// ❌ MAL - Fácil pasar parámetros en orden incorrecto
await _service.CreateAnnouncementAsync(
    content,  // ¡Error! Debería ser title
    title,    // ¡Error! Debería ser content
    true,
    userId,
    DateTime.Now,
    1
);
```

**Problemas**:
1. Difícil de leer y mantener
2. Propenso a errores (orden incorrecto)
3. Difícil de extender (agregar nuevos campos)
4. No se puede validar con Data Annotations
5. No sigue el patrón del proyecto

**Solución**: Usar DTOs

```csharp
// ✅ BIEN - Usar DTO
public async Task<AnnouncementDto> CreateAnnouncementAsync(
    CreateAnnouncementDto dto, 
    string userId)
{
    // ...
}

// ✅ BIEN - Claro y fácil de usar
var dto = new CreateAnnouncementDto
{
    Title = "Título",
    Content = "Contenido",
    IsUrgent = true,
    EventDate = DateTime.Now,
    TypeId = 1
};
await _service.CreateAnnouncementAsync(dto, userId);
```

---

### ❌ ANTI-PATTERN #2: Exponer Entities Directamente

```csharp
// ❌ MAL - Retornar entidad directamente
public async Task<Announcement> GetAnnouncementAsync(int id)
{
    return await _repository.GetByIdAsync(id);
}

// ❌ MAL - Expone detalles internos
public class Announcement {
    public string Password { get; set; }  // ¡Expuesto al frontend!
    public bool IsDeleted { get; set; }   // Detalles internos
    public AnnouncementType Type { get; set; }  // Relación compleja
}
```

**Solución**: Siempre usar DTOs

```csharp
// ✅ BIEN - Retornar DTO
public async Task<AnnouncementDto> GetAnnouncementAsync(int id)
{
    var announcement = await _repository.GetByIdAsync(id);
    return _mapper.Map<AnnouncementDto>(announcement);
}

// ✅ BIEN - Solo expone lo necesario
public class AnnouncementDto {
    public int Id { get; set; }
    public string Title { get; set; }
    public string Content { get; set; }
    public string TypeName { get; set; }  // Aplanado
}
```

---

### ❌ ANTI-PATTERN #3: Violaciones de Clean Architecture

```csharp
// ❌ MAL - En Application/Services/
public class DebtService {
    private readonly ApplicationDbContext _context; // ❌ MAL
    private readonly UserManager<ApplicationUser> _userManager; // ❌ MAL
}

// ❌ MAL - En Controllers/
public class DebtsController {
    private readonly ApplicationDbContext _context; // ❌ MAL
    private readonly IDebtRepository _debtRepository; // ❌ MAL (usar servicio)
}

// ❌ MAL - Application referenciando Infrastructure
using CondoFlow.Infrastructure.Data; // ❌ MAL
```

---

### ❌ ANTI-PATTERN #4: Valores Hardcodeados

```csharp
// ❌ MAL - Valores hardcodeados
public class DebtService {
    public decimal CalculateAmount() {
        var amount = apartment.Number == "501" ? 1000 : 2000; // ❌ MAL
        return amount;
    }
}

// ❌ MAL - Strings hardcodeados
public class IncidentService {
    public void UpdateStatus() {
        incident.Status = "in_progress"; // ❌ MAL
    }
}

// ❌ MAL - Roles hardcodeados
public class NotificationService {
    public async Task SendNotification() {
        var isAdmin = userRoles.Contains("Admin"); // ❌ MAL
        await SendToRole("Owner"); // ❌ MAL
    }
}

// ❌ MAL - Status hardcodeados
public class PaymentService {
    public void ApprovePayment() {
        payment.Status = "Approved"; // ❌ MAL
    }
}
```

**Solución**: Usar constantes, enums o configuración

```csharp
// ✅ BIEN - Usar configuración
public class DebtService {
    private readonly DebtConfiguration _config;
    
    public decimal CalculateAmount() {
        var isRoof = _config.RoofApartmentNumbers.Contains(apartment.Number);
        return isRoof ? _config.RoofApartmentAmount : _config.DefaultAmount;
    }
}

// ✅ BIEN - Usar enums/constantes
public class IncidentService {
    public void UpdateStatus() {
        incident.Status = StatusCodes.InProgress; // ✅ BIEN
    }
}

// ✅ BIEN - Usar constantes de roles
public class NotificationService {
    public async Task SendNotification() {
        var isAdmin = userRoles.Contains(UserRoles.Admin); // ✅ BIEN
        await SendToRole(UserRoles.Owner); // ✅ BIEN
    }
}

// ✅ BIEN - Usar constantes de status
public class PaymentService {
    public void ApprovePayment() {
        payment.Status = PaymentStatus.Approved; // ✅ BIEN
    }
}
```

**Ubicación de constantes**:
```
Domain/Enums/
├── StatusCodes.cs          # Estados de incidentes, deudas, etc.
├── UserRoles.cs            # Roles de usuario (Admin, Owner)
├── PaymentConceptCodes.cs  # Conceptos de pago
├── PaymentStatus.cs        # Estados de pago
└── PollStatus.cs           # Estados de encuestas
```

**Ejemplo de constantes**:
```csharp
// Domain/Enums/UserRoles.cs
public static class UserRoles
{
    public const string Admin = "Admin";
    public const string Owner = "Owner";
}

// Uso en controllers
[Authorize(Roles = UserRoles.Admin)] // ✅ BIEN

// Uso en servicios
var isAdmin = userRoles.Contains(UserRoles.Admin); // ✅ BIEN
```

---

### ✅ HACER:

```csharp
// ✅ BIEN - En Application/Services/
public class DebtService {
    private readonly IDebtRepository _debtRepository; // ✅ BIEN
    private readonly IUserRepository _userRepository; // ✅ BIEN
    private readonly DebtConfiguration _debtConfig; // ✅ BIEN
}

// ✅ BIEN - Usar DTOs en lugar de múltiples parámetros
public async Task<AnnouncementDto> CreateAnnouncementAsync(
    CreateAnnouncementDto dto, 
    string userId)
{
    var announcement = _mapper.Map<Announcement>(dto);
    announcement.CreatedBy = userId;
    announcement.CreatedAt = DateTime.UtcNow;
    
    await _repository.AddAsync(announcement);
    return _mapper.Map<AnnouncementDto>(announcement);
}

// ✅ BIEN - En Infrastructure/Repositories/
public class DebtRepository {
    private readonly ApplicationDbContext _context; // ✅ BIEN
}

// ✅ BIEN - En Controllers/
public class DebtsController : BaseApiController {
    private readonly IDebtService _debtService; // ✅ BIEN
    
    [HttpPost]
    public async Task<IActionResult> CreateDebt([FromBody] CreateDebtDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var debt = await _debtService.CreateDebtAsync(dto, userId);
        return Created(debt, "Deuda creada exitosamente");
    }
}

// ✅ BIEN - Uso de configuración
public class DebtService {
    public decimal CalculateAmount() {
        var isRoof = _debtConfig.RoofApartmentNumbers.Contains(apartment.Number);
        var amount = isRoof ? _debtConfig.RoofApartmentAmount : _debtConfig.DefaultAmount;
        return amount;
    }
}

// ✅ BIEN - Uso de constantes/enums
public class IncidentService {
    public void UpdateStatus() {
        incident.Status = StatusCodes.InProgress; // ✅ BIEN
    }
}
```

---

## 📋 Reglas de Oro para DTOs

### 1. **Siempre usa DTOs para transferencia de datos**
```csharp
// ✅ BIEN
public async Task<AnnouncementDto> GetAnnouncementAsync(int id)

// ❌ MAL
public async Task<Announcement> GetAnnouncementAsync(int id)
```

### 2. **Usa DTOs específicos para Create/Update**
```csharp
// ✅ BIEN - DTOs específicos
CreateAnnouncementDto  // Para crear
UpdateAnnouncementDto  // Para actualizar
AnnouncementDto        // Para leer

// ❌ MAL - Reutilizar el mismo DTO
AnnouncementDto  // Para todo
```

### 3. **Máximo 3-4 parámetros en métodos**
```csharp
// ✅ BIEN - Pocos parámetros
public async Task<X> CreateAsync(CreateXDto dto, string userId)

// ❌ MAL - Muchos parámetros
public async Task<X> CreateAsync(string a, string b, int c, bool d, DateTime e)
```

### 4. **Usa Data Annotations en DTOs de entrada**
```csharp
// ✅ BIEN
public class CreateAnnouncementDto
{
    [Required(ErrorMessage = "El título es requerido")]
    [MaxLength(200)]
    public string Title { get; set; }
}
```

### 5. **Aplana relaciones en DTOs de salida**
```csharp
// ✅ BIEN - Aplanado
public class AnnouncementDto
{
    public string TypeName { get; set; }  // Solo el nombre
}

// ❌ MAL - Relación compleja
public class AnnouncementDto
{
    public AnnouncementType Type { get; set; }  // Objeto completo
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

### DTOs:
- [ ] ¿Los métodos usan DTOs en lugar de múltiples parámetros? → ✅ Aprobar
- [ ] ¿Los DTOs de entrada tienen validaciones (Data Annotations)? → ✅ Aprobar
- [ ] ¿Los DTOs de salida tienen relaciones aplanadas? → ✅ Aprobar
- [ ] ¿Se usan DTOs específicos para Create/Update? → ✅ Aprobar
- [ ] ¿Los métodos tienen máximo 3-4 parámetros? → ✅ Aprobar
- [ ] ¿Se usa AutoMapper para mapear Entity ↔ DTO? → ✅ Aprobar

### Clean Architecture:
- [ ] ¿Application tiene alguna referencia a Infrastructure? → ❌ Rechazar
- [ ] ¿Los servicios en Application usan DbContext directamente? → ❌ Rechazar
- [ ] ¿Los controllers inyectan DbContext o repositorios? → ❌ Rechazar
- [ ] ¿Las interfaces están en Application? → ✅ Aprobar
- [ ] ¿Las implementaciones están en Infrastructure? → ✅ Aprobar
- [ ] ¿Los servicios de negocio están en Application/Services? → ✅ Aprobar
- [ ] ¿Los servicios usan solo interfaces? → ✅ Aprobar

### Código Limpio:
- [ ] ¿Se evitan valores hardcodeados? → ✅ Aprobar
- [ ] ¿Se usan enums/constantes en lugar de strings? → ✅ Aprobar
- [ ] ¿Se usa configuración para valores variables? → ✅ Aprobar

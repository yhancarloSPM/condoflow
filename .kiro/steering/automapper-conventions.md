# CondoFlow - AutoMapper & Naming Conventions

## 🗺️ AutoMapper - Mapeo de Objetos

### ¿Por qué usar AutoMapper?

- Elimina código repetitivo de mapeo manual
- Reduce errores al copiar propiedades
- Facilita el mantenimiento
- Hace el código más limpio

---

### Estructura en el Proyecto

```
Application/
├── Mappings/
│   └── MappingProfile.cs    # Configuración de todos los mapeos
└── DTOs/                    # Data Transfer Objects
    ├── DebtDto.cs
    ├── PaymentDto.cs
    └── ...
```

---

### Configuración

**En Program.cs**:
```csharp
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
                opt => opt.MapFrom(src => src.Owner != null ? src.Owner.Name : string.Empty));
    }
}
```

---

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
            Amount = payment.Amount,
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
}
```

---

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

---

### Reglas de AutoMapper

- ✅ Todos los mapeos en `Application/Mappings/MappingProfile.cs`
- ✅ Inyectar `IMapper` en servicios de Application
- ✅ Usar AutoMapper para mapear entre Entities y DTOs
- ✅ Configurar mapeos personalizados para propiedades de navegación
- ❌ NO usar AutoMapper en Infrastructure
- ❌ NO hacer mapeo manual cuando AutoMapper puede hacerlo
- ❌ NO crear múltiples perfiles sin razón

---

## 📝 Convenciones de Nombres

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

---

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
```

**Controladores** → terminar en `Controller`
```csharp
DebtsController, PaymentsController, IncidentsController
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
    Rejected
}
```

---

### Ejemplos Completos

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

---

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

## ✅ Checklist para Code Review

### AutoMapper:
- [ ] ¿Los mapeos están en `MappingProfile.cs`?
- [ ] ¿Los servicios inyectan `IMapper`?
- [ ] ¿Se usa AutoMapper en lugar de mapeo manual?
- [ ] ¿Los mapeos personalizados están bien configurados?

### Naming:
- [ ] ¿Las clases usan `PascalCase`?
- [ ] ¿Las interfaces tienen prefijo `I`?
- [ ] ¿Los métodos async tienen sufijo `Async`?
- [ ] ¿Los campos privados tienen prefijo `_`?
- [ ] ¿Los nombres son descriptivos y claros?
- [ ] ¿Los archivos coinciden con el nombre de la clase?

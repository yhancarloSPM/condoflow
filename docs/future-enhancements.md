# CondoFlow - Low Priority Improvements

## 📋 Tareas de Baja Prioridad

Estas mejoras son importantes pero no críticas. Se pueden implementar gradualmente.

---

## 8. Unit Tests

### Estado Actual:
- Proyectos de test existen pero están vacíos o con tests básicos
- `CondoFlow.Application.Tests/UnitTest1.cs` - vacío
- `CondoFlow.Infrastructure.Tests/UnitTest1.cs` - vacío
- `CondoFlow.WebApi.Tests/AuthControllerUnitTests.cs` - básico

### Objetivo:
Implementar tests unitarios para servicios, repositorios y controllers

### Prioridad de Testing:
1. **Servicios de Application** (más importante)
   - ReservationService
   - DebtService
   - IncidentService
   - PaymentService
   - UserService

2. **Repositorios** (medio)
   - Tests de queries complejas
   - Tests de validaciones

3. **Controllers** (menos importante)
   - Ya están testeados indirectamente por integration tests

### Herramientas:
- xUnit (ya instalado)
- Moq (para mocking)
- FluentAssertions (para assertions legibles)

### Ejemplo de Test:
```csharp
public class ReservationServiceTests
{
    private readonly Mock<IReservationRepository> _mockRepository;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly ReservationService _service;

    public ReservationServiceTests()
    {
        _mockRepository = new Mock<IReservationRepository>();
        _mockNotificationService = new Mock<INotificationService>();
        _service = new ReservationService(_mockRepository.Object, _mockNotificationService.Object);
    }

    [Fact]
    public async Task CreateReservationAsync_WithPastDate_ThrowsInvalidOperationException()
    {
        // Arrange
        var dto = new CreateReservationDto
        {
            ReservationDate = DateTime.Now.AddDays(-1),
            StartTime = "10:00",
            EndTime = "12:00"
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.CreateReservationAsync(dto, "user123")
        );
    }
}
```

---

## 9. Paginación Consistente

### Estado Actual:
- Algunos endpoints retornan todas las entidades sin paginación
- No hay clase `PagedResult<T>` estándar

### Objetivo:
Implementar paginación consistente en todos los endpoints que retornan listas

### Implementación:

#### 1. Crear clase PagedResult
```csharp
// Application/Common/Models/PagedResult.cs
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public int TotalCount { get; set; }
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}
```

#### 2. Crear clase PaginationParams
```csharp
// Application/Common/Models/PaginationParams.cs
public class PaginationParams
{
    private const int MaxPageSize = 50;
    private int _pageSize = 10;

    public int PageNumber { get; set; } = 1;
    
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : value;
    }
}
```

#### 3. Actualizar Repositorios
```csharp
public interface IReservationRepository
{
    Task<PagedResult<Reservation>> GetAllAsync(PaginationParams paginationParams);
}
```

#### 4. Actualizar Controllers
```csharp
[HttpGet]
public async Task<IActionResult> GetAll([FromQuery] PaginationParams paginationParams)
{
    var reservations = await _reservationService.GetAllReservationsAsync(paginationParams);
    return Success(reservations, "Reservas obtenidas exitosamente");
}
```

### Endpoints a Actualizar:
- GET /api/reservations
- GET /api/debts
- GET /api/payments
- GET /api/incidents
- GET /api/expenses
- GET /api/users
- GET /api/announcements

---

## 10. Logging Estructurado

### Estado Actual:
- Uso de `Console.WriteLine` para debugging
- No hay niveles de log
- No se puede filtrar logs

### Objetivo:
Implementar logging estructurado con `ILogger<T>`

### Implementación:

#### 1. Reemplazar Console.WriteLine
```csharp
// ❌ MAL
Console.WriteLine($"[DEBUG] SendReservationStatusNotification llamado...");

// ✅ BIEN
_logger.LogInformation("SendReservationStatusNotification called for reservation {ReservationId} with status {Status}", 
    reservation.Id, reservation.Status);
```

#### 2. Niveles de Log
```csharp
// Trace - Información muy detallada
_logger.LogTrace("Entering method {MethodName}", nameof(CreateReservationAsync));

// Debug - Información de debugging
_logger.LogDebug("Validating reservation date {Date}", dto.ReservationDate);

// Information - Flujo normal de la aplicación
_logger.LogInformation("Reservation {ReservationId} created successfully", reservation.Id);

// Warning - Situaciones anormales pero manejables
_logger.LogWarning("User {UserId} has reached monthly reservation limit", userId);

// Error - Errores que requieren atención
_logger.LogError(ex, "Failed to create reservation for user {UserId}", userId);

// Critical - Errores críticos que requieren acción inmediata
_logger.LogCritical(ex, "Database connection failed");
```

#### 3. Configuración en appsettings.json
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "CondoFlow": "Debug"
    }
  }
}
```

#### 4. Integración con Serilog (opcional)
```csharp
// Program.cs
builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration));
```

### Servicios a Actualizar:
- ReservationService
- DebtService
- IncidentService
- PaymentService
- NotificationService

---

## 📊 Resumen de Tareas de Baja Prioridad

| Tarea | Esfuerzo | Impacto | Prioridad |
|-------|----------|---------|-----------|
| Unit Tests | Alto | Alto | 1 |
| Paginación | Medio | Medio | 2 |
| Logging | Bajo | Medio | 3 |

---

## 🎯 Plan de Implementación

### Fase 1: Logging (1-2 días)
1. Reemplazar Console.WriteLine con ILogger
2. Configurar niveles de log
3. Agregar logging en servicios críticos

### Fase 2: Paginación (2-3 días)
1. Crear PagedResult y PaginationParams
2. Actualizar repositorios
3. Actualizar servicios
4. Actualizar controllers
5. Actualizar frontend para manejar paginación

### Fase 3: Unit Tests (1-2 semanas)
1. Configurar proyecto de tests
2. Instalar dependencias (Moq, FluentAssertions)
3. Escribir tests para servicios
4. Escribir tests para repositorios
5. Configurar CI/CD para ejecutar tests

---

## ✅ Beneficios

### Unit Tests:
- Confianza en refactorings
- Detección temprana de bugs
- Documentación viva del código
- Facilita mantenimiento

### Paginación:
- Mejor performance
- Menos uso de memoria
- Mejor experiencia de usuario
- Escalabilidad

### Logging:
- Debugging más fácil
- Monitoreo de producción
- Auditoría
- Troubleshooting rápido

---

**Nota:** Estas tareas son importantes pero no urgentes. Se pueden implementar gradualmente sin afectar la funcionalidad actual del sistema.

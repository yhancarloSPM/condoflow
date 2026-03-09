# CondoFlow - API Response Standards

## 📋 Respuestas API Estandarizadas

### Estructura de ApiResponse

Todas las respuestas de la API deben usar `ApiResponse<T>` o `ApiResponse` para mantener consistencia.

```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public int StatusCode { get; set; }
    public T? Data { get; set; }
    public List<string> Errors { get; set; }
}
```

---

## 🎯 BaseApiController

Todos los controllers deben heredar de `BaseApiController` para usar métodos helper estandarizados.

### Ubicación
```
WebApi/Controllers/BaseApiController.cs
```

### Métodos Disponibles

**Respuestas Exitosas:**
```csharp
// Con datos
protected IActionResult Success<T>(T data, string message = "...", int statusCode = 200)

// Sin datos
protected IActionResult Success(string message = "...", int statusCode = 200)

// Creación (201)
protected IActionResult Created<T>(T data, string message = "...")
```

**Respuestas de Error:**
```csharp
// Error genérico
protected IActionResult Error(string message, int statusCode = 400, List<string>? errors = null)

// Error con tipo genérico
protected IActionResult Error<T>(string message, int statusCode = 400, List<string>? errors = null)

// 404 Not Found
protected IActionResult NotFoundError(string message = "Resource not found")
protected IActionResult NotFoundError<T>(string message = "Resource not found")

// 401 Unauthorized
protected IActionResult UnauthorizedError(string message = "Unauthorized access")

// 403 Forbidden
protected IActionResult ForbiddenError(string message = "Access forbidden")

// 400 Bad Request
protected IActionResult BadRequestError(string message = "Invalid request", List<string>? errors = null)
```

---

## ✅ Uso Correcto

### Ejemplo de Controller Estandarizado

```csharp
[ApiController]
[Route("api/[controller]")]
public class ExpensesController : BaseApiController
{
    private readonly IExpenseService _expenseService;

    public ExpensesController(IExpenseService expenseService)
    {
        _expenseService = expenseService;
    }

    [HttpGet]
    public async Task<IActionResult> GetExpenses()
    {
        var expenses = await _expenseService.GetAllExpensesAsync();
        return Success(expenses, "Gastos obtenidos exitosamente");
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetExpense(int id)
    {
        var expense = await _expenseService.GetExpenseByIdAsync(id);
        if (expense == null)
            return NotFoundError<ExpenseDto>("Gasto no encontrado");

        return Success(expense, "Gasto obtenido exitosamente");
    }

    [HttpPost]
    public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequestError("Datos inválidos");

        var expense = await _expenseService.CreateExpenseAsync(dto);
        return Created(expense, "Gasto creado exitosamente");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteExpense(int id)
    {
        var deleted = await _expenseService.DeleteExpenseAsync(id);
        if (!deleted)
            return NotFoundError("Gasto no encontrado");

        return Success("Gasto eliminado exitosamente");
    }
}
```

---

## ❌ Anti-Patterns a Evitar

### 1. NO usar BaseApiController

```csharp
// ❌ MAL - Heredar de ControllerBase
[ApiController]
[Route("api/[controller]")]
public class ExpensesController : ControllerBase  // ❌ MAL
{
    // ...
}

// ✅ BIEN - Heredar de BaseApiController
[ApiController]
[Route("api/[controller]")]
public class ExpensesController : BaseApiController  // ✅ BIEN
{
    // ...
}
```

### 2. Construcción Manual de ApiResponse

```csharp
// ❌ MAL - Construcción manual con new
return Ok(new ApiResponse<ExpenseDto>
{
    Success = true,
    Data = expense,
    Message = "Gasto obtenido exitosamente",
    StatusCode = 200
});

// ❌ MAL - Usar métodos estáticos directamente
return Ok(ApiResponse<ExpenseDto>.SuccessResult(expense, "...", 200));

// ❌ MAL - Usar StatusCode() con construcción manual
return StatusCode(200, ApiResponse<object>.SuccessResult(data, "...", 200));

// ✅ BIEN - Usar métodos helper de BaseApiController
return Success(expense, "Gasto obtenido exitosamente");
```

### 3. Retornar datos sin ApiResponse

```csharp
// ❌ MAL - Retornar datos directamente
[HttpGet]
public async Task<IActionResult> GetExpenses()
{
    var expenses = await _expenseService.GetAllExpensesAsync();
    return Ok(expenses);  // ❌ Sin ApiResponse
}

// ✅ BIEN - Usar Success() que envuelve en ApiResponse
[HttpGet]
public async Task<IActionResult> GetExpenses()
{
    var expenses = await _expenseService.GetAllExpensesAsync();
    return Success(expenses, "Gastos obtenidos exitosamente");
}
```

### 4. Usar Ok(), BadRequest(), NotFound() directamente

```csharp
// ❌ MAL - Usar métodos de ControllerBase directamente
[HttpGet("{id}")]
public async Task<IActionResult> GetExpense(int id)
{
    var expense = await _expenseService.GetExpenseByIdAsync(id);
    if (expense == null)
        return NotFound();  // ❌ Sin ApiResponse

    return Ok(expense);  // ❌ Sin ApiResponse
}

// ✅ BIEN - Usar métodos helper de BaseApiController
[HttpGet("{id}")]
public async Task<IActionResult> GetExpense(int id)
{
    var expense = await _expenseService.GetExpenseByIdAsync(id);
    if (expense == null)
        return NotFoundError<ExpenseDto>("Gasto no encontrado");

    return Success(expense, "Gasto obtenido exitosamente");
}
```

### 5. Códigos de estado hardcodeados

```csharp
// ❌ MAL - Números hardcodeados
return StatusCode(200, ApiResponse<object>.SuccessResult(data, "...", 200));
return StatusCode(404, ApiResponse.ErrorResult("...", 404));
return StatusCode(500, ApiResponse.ErrorResult("...", 500));

// ✅ BIEN - Usar constantes de HttpStatusCodes
return Success(data);  // Usa HttpStatusCodes.Ok internamente
return NotFoundError("...");  // Usa HttpStatusCodes.NotFound internamente
return InternalServerError("...");  // Usa HttpStatusCodes.InternalServerError
```

### 6. Try-catch innecesarios

```csharp
// ❌ MAL - Try-catch sin lógica específica
[HttpGet]
public async Task<IActionResult> GetApartments()
{
    try
    {
        var apartments = await _apartmentRepository.GetAllApartmentsAsync();
        return Success(apartments, "Apartamentos obtenidos exitosamente");
    }
    catch (Exception)
    {
        return StatusCode(500, Error("Error al obtener los apartamentos", 500));
    }
}

// ✅ BIEN - Sin try-catch (GlobalExceptionMiddleware lo maneja)
[HttpGet]
public async Task<IActionResult> GetApartments()
{
    var apartments = await _apartmentRepository.GetAllApartmentsAsync();
    return Success(apartments, "Apartamentos obtenidos exitosamente");
}
```

### 7. Mezclar patrones

```csharp
// ❌ MAL - Algunos métodos con ApiResponse, otros sin
public class ExpensesController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetExpenses()
    {
        var expenses = await _expenseService.GetAllExpensesAsync();
        return Ok(expenses);  // ❌ Sin ApiResponse
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetExpense(int id)
    {
        var expense = await _expenseService.GetExpenseByIdAsync(id);
        return Success(expense, "...");  // ✅ Con ApiResponse
    }
}

// ✅ BIEN - Todos los métodos usan el mismo patrón
public class ExpensesController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetExpenses()
    {
        var expenses = await _expenseService.GetAllExpensesAsync();
        return Success(expenses, "Gastos obtenidos exitosamente");
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetExpense(int id)
    {
        var expense = await _expenseService.GetExpenseByIdAsync(id);
        if (expense == null)
            return NotFoundError<ExpenseDto>("Gasto no encontrado");

        return Success(expense, "Gasto obtenido exitosamente");
    }
}
```

---

## 🔧 Manejo de Excepciones

### GlobalExceptionMiddleware

El middleware global maneja excepciones no capturadas y las convierte en ApiResponse.

**Ubicación:** `WebApi/Middleware/GlobalExceptionMiddleware.cs`

**Beneficio:** No necesitas try-catch en cada método del controller.

### Regla General: NO usar try-catch

```csharp
// ✅ BIEN - Sin try-catch (middleware lo maneja)
[HttpGet("{id}")]
public async Task<IActionResult> GetExpense(int id)
{
    var expense = await _expenseService.GetExpenseByIdAsync(id);
    if (expense == null)
        return NotFoundError<ExpenseDto>("Gasto no encontrado");

    return Success(expense, "Gasto obtenido exitosamente");
}

[HttpGet]
public async Task<IActionResult> GetApartments()
{
    var apartments = await _apartmentRepository.GetAllApartmentsAsync();
    return Success(apartments, "Apartamentos obtenidos exitosamente");
}

[HttpDelete("{id}")]
public async Task<IActionResult> DeleteExpense(int id)
{
    var deleted = await _expenseService.DeleteExpenseAsync(id);
    if (!deleted)
        return NotFoundError("Gasto no encontrado");

    return Success("Gasto eliminado exitosamente");
}
```

### ❌ Anti-Pattern: Try-catch innecesario

```csharp
// ❌ MAL - Try-catch innecesario
[HttpGet("{id}")]
public async Task<IActionResult> GetExpense(int id)
{
    try
    {
        var expense = await _expenseService.GetExpenseByIdAsync(id);
        return Success(expense);
    }
    catch (Exception ex)
    {
        return StatusCode(500, Error($"Error: {ex.Message}", 500));
    }
}

// ❌ MAL - Try-catch genérico sin lógica específica
[HttpGet]
public async Task<IActionResult> GetApartments()
{
    try
    {
        var apartments = await _apartmentRepository.GetAllApartmentsAsync();
        return Ok(ApiResponse<object>.SuccessResult(apartments, "...", 200));
    }
    catch (Exception)
    {
        return StatusCode(500, ApiResponse.ErrorResult("Error al obtener...", 500));
    }
}
```

### ✅ Cuándo SÍ usar try-catch

Solo usa try-catch cuando necesitas:

1. **Lógica específica de manejo de errores** (no solo retornar error genérico)
2. **Continuar la ejecución** después de un error no crítico
3. **Logging específico** antes de propagar la excepción

**Ejemplo válido - Notificación no crítica:**
```csharp
[HttpPut("{paymentId}/approve")]
public async Task<IActionResult> ApprovePayment(Guid paymentId)
{
    var payment = await _paymentRepository.GetByIdAsync(paymentId);
    if (payment == null)
        return NotFoundError("Pago no encontrado");

    payment.Approve();
    await _paymentRepository.UpdateAsync(payment);

    // Try-catch VÁLIDO: La notificación no debe romper la operación principal
    try
    {
        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.OwnerId == payment.OwnerId);
        if (user != null)
        {
            await _notificationService.SendPaymentStatusNotificationAsync(
                user.Id, payment.Id, UserStatusCodes.Approved, $"{user.FirstName} {user.LastName}", payment.Amount.Amount);
        }
    }
    catch (Exception ex)
    {
        // Log error but continue - notification failure shouldn't break the operation
        _logger.LogError(ex, "Failed to send notification for payment {PaymentId}", paymentId);
    }

    return Success(new { paymentId }, "Pago aprobado exitosamente");
}
```

**Ejemplo válido - Cleanup de recursos:**
```csharp
[HttpPut("{id}")]
public async Task<IActionResult> UpdateExpense(int id, [FromForm] UpdateExpenseDto updateDto, [FromForm] IFormFile? invoice)
{
    string? invoiceUrl = null;
    if (invoice != null)
    {
        var currentExpense = await _expenseService.GetExpenseByIdAsync(id);
        if (currentExpense != null && !string.IsNullOrEmpty(currentExpense.InvoiceUrl))
        {
            // Try-catch VÁLIDO: Eliminar archivo no debe romper la actualización
            try
            {
                DeleteInvoiceFile(currentExpense.InvoiceUrl);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete old invoice file");
            }
        }
        invoiceUrl = await SaveInvoiceFileAsync(invoice);
    }

    var expense = await _expenseService.UpdateExpenseAsync(id, updateDto, invoiceUrl);
    if (expense == null)
        return NotFoundError<ExpenseDto>("Gasto no encontrado");

    return Success(expense, "Gasto actualizado exitosamente");
}
```

### 🚫 Cuándo NO usar try-catch

```csharp
// ❌ MAL - Solo para retornar error genérico
try
{
    var data = await _service.GetDataAsync();
    return Success(data);
}
catch (Exception ex)
{
    return StatusCode(500, Error("Error al obtener datos", 500));
}

// ❌ MAL - Sin lógica específica de manejo
try
{
    await _repository.DeleteAsync(id);
    return Success("Eliminado");
}
catch
{
    return StatusCode(500, Error("Error", 500));
}

// ❌ MAL - Catch vacío
try
{
    await _service.DoSomethingAsync();
}
catch (Exception ex)
{
    // Catch vacío - nunca hagas esto
}
```

---

## 📊 Estructura de Respuesta en Frontend

El frontend Angular siempre espera esta estructura:

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  errors?: string[];
}
```

### Uso en Frontend

```typescript
this.expenseService.getExpenses().subscribe({
  next: (response) => {
    if (response.success) {
      this.expenses = response.data;
      console.log(response.message);
    }
  },
  error: (error) => {
    console.error(error.error.message);
    console.error(error.error.errors);
  }
});
```

---

## ✅ Checklist para Code Review

### Controllers:
- [ ] ¿El controller hereda de `BaseApiController`?
- [ ] ¿Usa métodos helper (`Success`, `Error`, etc.)?
- [ ] ¿NO construye `ApiResponse` manualmente?
- [ ] ¿NO usa `Ok()`, `BadRequest()`, etc. directamente?

### Respuestas:
- [ ] ¿Todas las respuestas usan `ApiResponse<T>`?
- [ ] ¿Los mensajes son descriptivos?
- [ ] ¿Los status codes son correctos? (200, 201, 400, 404, 500)

### Excepciones:
- [ ] ¿Evita try-catch innecesarios?
- [ ] ¿Deja que GlobalExceptionMiddleware maneje errores no esperados?

---

## 🎓 Beneficios

1. **Consistencia:** Todas las respuestas tienen la misma estructura
2. **Mantenibilidad:** Cambios centralizados en BaseApiController
3. **Frontend Simplificado:** Siempre espera el mismo formato
4. **Menos Código:** Métodos helper reducen boilerplate
5. **Mejor Testing:** Estructura predecible facilita tests
6. **Documentación Automática:** Swagger muestra estructura consistente

---

## 📝 Reglas de Oro

1. **SIEMPRE** hereda de `BaseApiController`
2. **SIEMPRE** usa métodos helper (`Success`, `Error`, etc.)
3. **NUNCA** construyas `ApiResponse` manualmente
4. **NUNCA** retornes datos sin `ApiResponse`
5. **EVITA** try-catch innecesarios (usa GlobalExceptionMiddleware)
6. **NUNCA** hardcodees status codes HTTP (usa los métodos helper que ya los incluyen)

---

## 🚫 Anti-Pattern: Status Codes Hardcodeados

### ❌ MAL - Status codes hardcodeados

```csharp
// ❌ MAL - Try-catch innecesario + status codes hardcodeados
[HttpGet]
public async Task<IActionResult> GetStatuses()
{
    try
    {
        var statuses = await _catalogRepository.GetStatusesAsync();
        return StatusCode(200, ApiResponse<object>.SuccessResult(statuses, "...", 200));
    }
    catch (Exception ex)
    {
        return StatusCode(500, ApiResponse<object>.ErrorResult("Error interno del servidor", 500));
    }
}

// ❌ MAL - Duplicación de status codes
return StatusCode(404, ApiResponse<object>.ErrorResult("No encontrado", 404));
return StatusCode(400, ApiResponse<object>.ErrorResult("Datos inválidos", 400));
```

### ✅ BIEN - Usar métodos helper de BaseApiController

```csharp
// ✅ BIEN - Sin try-catch, sin status codes hardcodeados
[HttpGet]
public async Task<IActionResult> GetStatuses()
{
    var statuses = await _catalogRepository.GetStatusesAsync();
    return Success(statuses, "Estados obtenidos exitosamente");
}

// ✅ BIEN - Métodos helper ya incluyen el status code correcto
return NotFoundError("No encontrado");        // 404 automático
return BadRequestError("Datos inválidos");    // 400 automático
return UnauthorizedError("No autorizado");    // 401 automático
return Success(data, "Éxito");                // 200 automático
return Created(data, "Creado");               // 201 automático
```

**Beneficios**:
- No duplicas el status code (una vez en `StatusCode()` y otra en `ApiResponse`)
- Código más limpio y legible
- Menos propenso a errores (status code inconsistente)
- GlobalExceptionMiddleware maneja errores 500 automáticamente


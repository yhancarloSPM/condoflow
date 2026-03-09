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

### NO HACER - Construcción Manual

```csharp
// ❌ MAL - Construcción manual de ApiResponse
return Ok(new ApiResponse<ExpenseDto>
{
    Success = true,
    Data = expense,
    Message = "Gasto obtenido exitosamente",
    StatusCode = 200
});

// ❌ MAL - No usar BaseApiController
public class ExpensesController : ControllerBase
{
    // ...
}

// ❌ MAL - Retornar datos sin ApiResponse
return Ok(expense);

// ❌ MAL - Usar métodos estáticos directamente
return Ok(ApiResponse<ExpenseDto>.SuccessResult(expense, "...", 200));
```

### ✅ HACER - Usar BaseApiController

```csharp
// ✅ BIEN - Usar métodos helper de BaseApiController
return Success(expense, "Gasto obtenido exitosamente");

// ✅ BIEN - Heredar de BaseApiController
public class ExpensesController : BaseApiController
{
    // ...
}

// ✅ BIEN - Usar métodos específicos
return NotFoundError<ExpenseDto>("Gasto no encontrado");
return Created(expense, "Gasto creado exitosamente");
```

---

## 🔧 Manejo de Excepciones

### GlobalExceptionMiddleware

El middleware global maneja excepciones no capturadas y las convierte en ApiResponse.

**Ubicación:** `WebApi/Middleware/GlobalExceptionMiddleware.cs`

**Beneficio:** No necesitas try-catch en cada método del controller.

### Ejemplo

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
```

**Nota:** Solo usa try-catch si necesitas lógica específica de manejo de errores.

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

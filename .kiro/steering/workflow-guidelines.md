# CondoFlow - Workflow Guidelines

## 🔍 Proceso de Trabajo con Steering Files

### Regla Principal

**ANTES de implementar cualquier cambio, SIEMPRE revisa los steering files relevantes.**

---

## 📚 Steering Files Disponibles

### Backend
- `backend-architecture.md` - Arquitectura Clean Architecture, capas, dependencias
- `automapper-conventions.md` - AutoMapper y convenciones de nombres
- `api-response-standards.md` - Estandarización de respuestas API

### Frontend
- `frontend-styles.md` - Sistema de estilos SCSS, colores, mixins

### General
- `clean-architecture.md` - Resumen general y enlaces a otros steering files
- `workflow-guidelines.md` - Este archivo (proceso de trabajo)

---

## 🎯 Workflow Recomendado

### 1. Recibir Tarea del Usuario

```
Usuario: "Necesito crear un nuevo endpoint para obtener reportes"
```

### 2. Identificar Steering Files Relevantes

Pregúntate:
- ¿Involucra backend? → `backend-architecture.md`, `api-response-standards.md`
- ¿Involucra frontend? → `frontend-styles.md`
- ¿Necesito crear servicios/repositorios? → `automapper-conventions.md`
- ¿Necesito entender la arquitectura? → `clean-architecture.md`

### 3. Leer Steering Files

**Antes de escribir código:**
```
1. Lee el steering file completo
2. Identifica las reglas aplicables
3. Revisa los ejemplos ✅ BIEN y ❌ MAL
4. Verifica el checklist al final
```

### 4. Implementar Siguiendo las Reglas

**Durante la implementación:**
- Sigue las convenciones de nombres
- Usa los patrones recomendados
- Evita los anti-patterns documentados

### 5. Auto-Review con Checklist

**Después de implementar:**
- Revisa el checklist del steering file
- Verifica que cumples todas las reglas
- Corrige cualquier desviación

---

## 📋 Ejemplos Prácticos

### Ejemplo 1: Crear Nuevo Controller

**Tarea:** Crear `ReportsController`

**Steering Files a Revisar:**
1. `api-response-standards.md` - Para estructura de respuestas
2. `backend-architecture.md` - Para ubicación y dependencias
3. `automapper-conventions.md` - Para nombres y convenciones

**Checklist:**
- [ ] ¿Hereda de `BaseApiController`?
- [ ] ¿Usa métodos helper (`Success`, `Error`)?
- [ ] ¿Sigue naming conventions (`PascalCase`, `Async` suffix)?
- [ ] ¿Inyecta solo interfaces de servicios?
- [ ] ¿NO inyecta `DbContext` o repositorios?

### Ejemplo 2: Crear Nuevo Componente de Estilos

**Tarea:** Crear badge para nuevo estado

**Steering Files a Revisar:**
1. `frontend-styles.md` - Para sistema de colores y mixins

**Checklist:**
- [ ] ¿Usa variables de `_variables.scss`?
- [ ] ¿NO usa colores hardcodeados?
- [ ] ¿Crea mixin en `_badges.scss` si es reutilizable?
- [ ] ¿Sigue el orden de importación correcto?

### Ejemplo 3: Crear Nuevo Servicio

**Tarea:** Crear `ReportService`

**Steering Files a Revisar:**
1. `backend-architecture.md` - Para ubicación y capas
2. `automapper-conventions.md` - Para AutoMapper y nombres
3. `clean-architecture.md` - Para reglas de dependencias

**Checklist:**
- [ ] ¿Interfaz en `Application/Interfaces/Services`?
- [ ] ¿Implementación en `Application/Services`?
- [ ] ¿Usa solo interfaces (no `DbContext`)?
- [ ] ¿Inyecta `IMapper` si necesita mapeo?
- [ ] ¿Nombres siguen convenciones (`IReportService`, `ReportService`)?
- [ ] ¿Métodos async tienen sufijo `Async`?

---

## 🚫 Anti-Patterns Comunes

### ❌ NO HACER

```
1. Implementar sin revisar steering files
2. "Adivinar" las convenciones
3. Copiar código antiguo sin verificar si sigue las reglas actuales
4. Ignorar los checklists
5. Mezclar patrones (algunos con ApiResponse, otros sin)
```

### ✅ HACER

```
1. Leer steering files ANTES de implementar
2. Seguir las convenciones documentadas
3. Usar los ejemplos como referencia
4. Completar los checklists
5. Mantener consistencia en todo el código
```

---

## 🔄 Actualización de Steering Files

### Cuándo Actualizar

Actualiza un steering file cuando:
- Se introduce un nuevo patrón o convención
- Se identifica un anti-pattern común
- Se mejora una práctica existente
- Se agrega nueva funcionalidad al proyecto

### Cómo Actualizar

1. Identifica el steering file relevante
2. Agrega la nueva regla/patrón
3. Incluye ejemplos ✅ BIEN y ❌ MAL
4. Actualiza el checklist si es necesario
5. Notifica al equipo del cambio

---

## 📊 Matriz de Decisión Rápida

| Tarea | Steering Files a Revisar |
|-------|--------------------------|
| Nuevo Controller | `api-response-standards.md`, `backend-architecture.md` |
| Nuevo Servicio | `backend-architecture.md`, `automapper-conventions.md` |
| Nuevo Repositorio | `backend-architecture.md`, `automapper-conventions.md` |
| Nuevo Componente UI | `frontend-styles.md` |
| Nuevo Estilo/Color | `frontend-styles.md` |
| Nueva Entidad | `backend-architecture.md`, `clean-architecture.md` |
| Refactoring | Todos los relevantes según el área |

---

## ✅ Checklist General

Antes de considerar una tarea completa:

### Código
- [ ] ¿Revisé los steering files relevantes?
- [ ] ¿Sigo todas las convenciones documentadas?
- [ ] ¿Evité todos los anti-patterns?
- [ ] ¿Completé los checklists específicos?

### Documentación
- [ ] ¿El código es auto-explicativo?
- [ ] ¿Agregué comentarios donde es necesario?
- [ ] ¿Actualicé steering files si introduje nuevos patrones?

### Testing
- [ ] ¿El código compila sin errores?
- [ ] ¿Probé la funcionalidad manualmente?
- [ ] ¿Verifiqué que no rompí funcionalidad existente?

---

## 🎓 Beneficios de Este Workflow

1. **Consistencia:** Todo el código sigue los mismos patrones
2. **Calidad:** Menos errores por seguir mejores prácticas
3. **Velocidad:** No pierdes tiempo "adivinando" cómo hacer las cosas
4. **Mantenibilidad:** Código predecible y fácil de entender
5. **Onboarding:** Nuevos desarrolladores tienen guías claras
6. **Code Review:** Revisiones más rápidas con checklists

---

## 📝 Regla de Oro

**"Si no sabes cómo hacer algo, primero busca en los steering files. Si no está documentado, documéntalo después de implementarlo."**

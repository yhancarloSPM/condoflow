# CondoFlow - Frontend Styles Guidelines

## 🎨 Sistema de Estilos y Colores

### Estructura de Archivos SCSS

```
web-portal/condoflow-web/src/styles/
├── styles.scss           # Archivo principal (importa todo)
├── _variables.scss       # Variables globales (FUENTE ÚNICA DE VERDAD)
└── _badges.scss          # Mixins para badges (usa variables)
```

### Orden de Importación (CRÍTICO)

En `styles.scss`, el orden DEBE ser:

```scss
@import 'bootstrap/dist/css/bootstrap.min.css';
@import 'primeicons/primeicons.css';

/* 1. Variables PRIMERO (fuente única de verdad) */
@import 'styles/variables';

/* 2. Badges DESPUÉS (usa las variables) */
@import 'styles/badges';
```

**¿Por qué este orden?**
- `_variables.scss` define los colores base
- `_badges.scss` usa esas variables para crear mixins
- Si importas badges antes que variables, los mixins no encontrarán las variables

---

## 📁 _variables.scss - Fuente Única de Verdad

**Responsabilidad**: Definir TODAS las variables del proyecto (colores, espaciados, breakpoints, etc.)

### Estructura:

```scss
// ============================================
// COLORES BASE (Paleta única)
// ============================================
$color-green: #10b981;
$color-orange: #f59e0b;
$color-red: #ef4444;
$color-blue: #3b82f6;
$color-purple: #8b5cf6;
$color-yellow: #eab308;
$color-gray: #6b7280;
$color-pink: #ec4899;
$color-teal: #14b8a6;

// ============================================
// GRADIENTES (generados desde colores base)
// ============================================
$gradient-green: linear-gradient(135deg, $color-green, darken($color-green, 10%));
$gradient-orange: linear-gradient(135deg, $color-orange, darken($color-orange, 10%));
// ... etc

// ============================================
// COLORES SEMÁNTICOS (alias de colores base)
// ============================================
$primary: $color-blue;
$secondary: $color-green;
$danger: $color-red;
$success: $color-green;
$warning: $color-orange;

// ============================================
// UTILIDADES
// ============================================
$border: #e5e7eb;
$background: #ffffff;
$shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

// ============================================
// BREAKPOINTS
// ============================================
$mobile: 576px;
$tablet: 768px;
$desktop: 992px;
```

### Reglas:

- ✅ Define SOLO variables (colores, tamaños, espaciados)
- ✅ Usa nombres descriptivos (`$color-green`, no `$green1`)
- ✅ Un solo color base por tipo (un rojo, un verde, etc.)
- ❌ NO defines mixins aquí
- ❌ NO defines estilos CSS aquí
- ❌ NO duplicas colores (usa alias si necesitas nombres diferentes)

---

## 🏷️ _badges.scss - Mixins y Utilidades

**Responsabilidad**: Definir mixins reutilizables para badges, cards, iconos, etc.

### Estructura:

```scss
// ============================================
// MAPEO DE ESTADOS A COLORES
// ============================================
$payment-status-colors: (
  'pending': $color-orange,
  'confirmed': $color-green,
  'rejected': $color-red
);

// ============================================
// MIXINS
// ============================================
@mixin badge-base {
  text-align: center !important;
  font-size: 0.75rem !important;
  // ...
}

@mixin status-badge($status) {
  @include badge-base;
  background-color: rgba(map-get($payment-status-colors, $status), 0.8) !important;
  color: white !important;
}
```

### Reglas:

- ✅ Usa variables de `_variables.scss`
- ✅ Define mixins reutilizables
- ✅ Agrupa mixins por funcionalidad (badges, cards, iconos)
- ❌ NO defines colores base aquí (usa los de `_variables.scss`)
- ❌ NO duplicas código entre mixins

---

## 🎯 Uso en Componentes

### Importación Automática

Los archivos `_variables.scss` y `_badges.scss` se importan globalmente en `styles.scss`, por lo que están disponibles en TODOS los componentes sin necesidad de importarlos manualmente.

### Ejemplo de Uso:

```scss
// my-component.component.scss

.header-icon {
  @include icon-bg-green;  // Usa el mixin de _badges.scss
  width: 3rem;
  height: 3rem;
}

.status-badge {
  @include status-badge('pending');  // Usa el mixin con estado
}

.custom-text {
  color: $color-blue;  // Usa la variable de _variables.scss
}

.amount-cell {
  @include amount-cell-green;  // Usa el mixin de celdas
}
```

---

## 📝 Mixins Disponibles

### Badges de Estado

```scss
@include status-badge('pending');      // Badge naranja
@include status-badge('confirmed');    // Badge verde
@include status-badge('rejected');     // Badge rojo
@include status-badge('reported');     // Badge naranja (incidentes)
@include status-badge('in_progress');  // Badge azul (incidentes)
@include status-badge('resolved');     // Badge verde (incidentes)
```

### Badges de Prioridad

```scss
@include priority-badge('low');        // Badge verde
@include priority-badge('medium');     // Badge naranja
@include priority-badge('high');       // Badge naranja
@include priority-badge('critical');   // Badge rojo
```

### Badges de Método de Pago

```scss
@include method-badge('cash');         // Badge verde
@include method-badge('transfer');     // Badge azul
@include method-badge('check');        // Badge morado
@include method-badge('card');         // Badge teal
```

### Iconos con Background

```scss
@include icon-bg-green;
@include icon-bg-orange;
@include icon-bg-red;
@include icon-bg-blue;
@include icon-bg-purple;
@include icon-bg-yellow;
@include icon-bg-teal;
```

### Cards con Estado

```scss
@include card-status-green;
@include card-status-orange;
@include card-status-red;
@include card-status-blue;
```

### Celdas de Montos

```scss
@include amount-cell-green;
@include amount-cell-orange;
@include amount-cell-red;
@include amount-cell-blue;
```

---

## 🚫 Anti-Patterns a Evitar

### ❌ NO HACER:

```scss
// Colores hardcodeados
.my-badge {
  background: #10b981;  // ❌ MAL
  color: #ffffff;       // ❌ MAL
}

// Duplicar estilos de badges
.status-pending {
  background: rgba(245, 158, 11, 0.8);  // ❌ MAL
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
}

// Importar archivos de estilos en componentes
@import 'styles/variables';  // ❌ MAL (ya está global)
```

### ✅ HACER:

```scss
// Usar variables
.my-badge {
  background: $color-green;  // ✅ BIEN
  color: white;
}

// Usar mixins
.status-pending {
  @include status-badge('pending');  // ✅ BIEN
}

// Usar variables directamente (ya están globales)
.custom-element {
  color: $color-blue;  // ✅ BIEN
}
```

---

## 🔧 Agregar Nuevos Colores o Mixins

### 1. Agregar un nuevo color base:

**En `_variables.scss`:**
```scss
$color-indigo: #6366f1;
$gradient-indigo: linear-gradient(135deg, $color-indigo, darken($color-indigo, 10%));
```

### 2. Agregar un nuevo mixin:

**En `_badges.scss`:**
```scss
@mixin icon-bg-indigo {
  background: $gradient-indigo;
}
```

### 3. Agregar un nuevo estado:

**En `_badges.scss`:**
```scss
$payment-status-colors: (
  'pending': $color-orange,
  'confirmed': $color-green,
  'rejected': $color-red,
  'processing': $color-blue  // Nuevo estado
);
```

Luego úsalo:
```scss
.status-badge {
  @include status-badge('processing');
}
```

---

## ✅ Checklist para Code Review

Antes de hacer commit, verificar:

- [ ] ¿Los colores están definidos en `_variables.scss`?
- [ ] ¿Los mixins están definidos en `_badges.scss`?
- [ ] ¿El orden de importación en `styles.scss` es correcto? (variables → badges)
- [ ] ¿Los componentes usan mixins en lugar de colores hardcodeados?
- [ ] ¿No hay duplicación de colores? (un solo rojo, un solo verde, etc.)
- [ ] ¿Los nombres de variables son descriptivos?

---

**IMPORTANTE**: Este sistema garantiza que todos los colores y estilos sean consistentes en toda la aplicación. Si necesitas cambiar un color, solo lo cambias en `_variables.scss` y se refleja en todos los componentes.

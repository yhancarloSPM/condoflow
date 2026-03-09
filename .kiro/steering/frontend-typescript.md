# CondoFlow - Frontend TypeScript & Angular Guidelines

## 🚫 Anti-Pattern #1: Uso de `any`

### ❌ MAL - Usar `any`

El uso de `any` elimina los beneficios del tipado estático de TypeScript y puede causar errores en tiempo de ejecución.

```typescript
// ❌ MAL - any en respuestas HTTP
this.http.get(`${environment.apiUrl}/users/profile`).subscribe({
  next: (response: any) => {
    if (response.success) {
      this.userDetails.set(response.data);
    }
  }
});

// ❌ MAL - any en parámetros de funciones
onPhoneNumberInput(event: any) {
  const input = event.target;
}

// ❌ MAL - any en validadores
passwordMatchValidator(form: any) {
  const newPassword = form.get('newPassword');
  const confirmPassword = form.get('confirmPassword');
}

// ❌ MAL - any en arrays
allReservations: any[] = [];
filteredReservations = signal<any[]>([]);

// ❌ MAL - any en servicios
createAnnouncement(announcement: any): Observable<any> {
  return this.http.post(this.apiUrl, announcement);
}

// ❌ MAL - any en cache
interface CacheEntry {
  response: any;
  timestamp: number;
}
```

---

### ✅ BIEN - Usar interfaces y tipos específicos

```typescript
// ✅ BIEN - Definir interfaces para respuestas API
interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  errors?: string[];
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  apartment: string;
  block: string;
}

// ✅ BIEN - Usar interfaces en HTTP requests
this.http.get<ApiResponse<UserProfile>>(`${environment.apiUrl}/users/profile`).subscribe({
  next: (response) => {
    if (response.success) {
      this.userDetails.set(response.data);
    }
  }
});

// ✅ BIEN - Tipar eventos del DOM
onPhoneNumberInput(event: Event) {
  const input = event.target as HTMLInputElement;
}

// ✅ BIEN - Tipar validadores con tipos de Angular
import { AbstractControl, ValidationErrors } from '@angular/forms';

passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
  const newPassword = form.get('newPassword');
  const confirmPassword = form.get('confirmPassword');
  
  if (newPassword?.value !== confirmPassword?.value) {
    return { passwordMismatch: true };
  }
  return null;
}

// ✅ BIEN - Tipar arrays con interfaces
interface Reservation {
  id: string;
  eventType: string;
  reservationDate: string;
  status: string;
  ownerName: string;
}

allReservations: Reservation[] = [];
filteredReservations = signal<Reservation[]>([]);

// ✅ BIEN - Tipar servicios
interface CreateAnnouncementDto {
  title: string;
  content: string;
  isUrgent: boolean;
  eventDate?: string;
  typeId?: number;
}

interface AnnouncementDto {
  id: number;
  title: string;
  content: string;
  isUrgent: boolean;
  eventDate?: string;
  typeName: string;
  createdBy: string;
  createdAt: string;
}

createAnnouncement(announcement: CreateAnnouncementDto): Observable<ApiResponse<AnnouncementDto>> {
  const headers = this.getAuthHeaders();
  return this.http.post<ApiResponse<AnnouncementDto>>(this.apiUrl, announcement, { headers });
}

// ✅ BIEN - Tipar cache con genéricos
interface CacheEntry<T> {
  response: T;
  timestamp: number;
}

private cache = new Map<string, CacheEntry<unknown>>();

get<T>(url: string, cacheDuration: number = this.defaultCacheDuration): T | null {
  const entry = this.cache.get(url);
  
  if (!entry) {
    return null;
  }
  
  const now = Date.now();
  if (now - entry.timestamp > cacheDuration) {
    this.cache.delete(url);
    return null;
  }
  
  return entry.response as T;
}

set<T>(url: string, response: T): void {
  this.cache.set(url, {
    response,
    timestamp: Date.now()
  });
}
```

---

## 📁 Organización de Interfaces

### Estructura recomendada:

```
src/app/
├── core/
│   └── models/
│       ├── api-response.model.ts      # ApiResponse<T>
│       ├── user.model.ts              # User, UserProfile, etc.
│       ├── announcement.model.ts      # Announcement, CreateAnnouncementDto, etc.
│       ├── debt.model.ts              # Debt, DebtDto, etc.
│       ├── payment.model.ts           # Payment, PaymentDto, etc.
│       ├── incident.model.ts          # Incident, IncidentDto, etc.
│       ├── reservation.model.ts       # Reservation, ReservationDto, etc.
│       └── index.ts                   # Exportar todas las interfaces
```

### Ejemplo de archivo de modelo:

```typescript
// src/app/core/models/announcement.model.ts

export interface AnnouncementDto {
  id: number;
  title: string;
  content: string;
  isUrgent: boolean;
  eventDate?: string;
  typeName: string;
  typeId?: number;
  createdBy: string;
  createdAt: string;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  isUrgent: boolean;
  eventDate?: string;
  typeId?: number;
}

export interface UpdateAnnouncementDto {
  title: string;
  content: string;
  isUrgent: boolean;
  eventDate?: string;
  typeId?: number;
}
```

### Uso en servicios:

```typescript
// src/app/core/services/announcement.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AnnouncementDto, CreateAnnouncementDto } from '../models/announcement.model';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  private apiUrl = `${environment.apiUrl}/announcements`;

  constructor(private http: HttpClient) {}

  getAnnouncements(): Observable<ApiResponse<AnnouncementDto[]>> {
    return this.http.get<ApiResponse<AnnouncementDto[]>>(this.apiUrl);
  }

  createAnnouncement(announcement: CreateAnnouncementDto): Observable<ApiResponse<AnnouncementDto>> {
    return this.http.post<ApiResponse<AnnouncementDto>>(this.apiUrl, announcement);
  }
}
```

---

## 🚫 Anti-Pattern #2: Declaraciones globales sin tipos

### ❌ MAL

```typescript
declare var bootstrap: any;
```

### ✅ BIEN

```typescript
// Opción 1: Instalar tipos oficiales
// npm install --save-dev @types/bootstrap

// Opción 2: Crear archivo de tipos personalizados
// src/app/types/bootstrap.d.ts
declare module 'bootstrap' {
  export class Modal {
    constructor(element: HTMLElement, options?: any);
    show(): void;
    hide(): void;
    dispose(): void;
  }
}

// Uso
import { Modal } from 'bootstrap';
const modal = new Modal(element);
```

---

## 🚫 Anti-Pattern #3: Type assertions innecesarias

### ❌ MAL

```typescript
const sorted = (response.data || []).sort((a: any, b: any) => {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
});
```

### ✅ BIEN

```typescript
interface Reservation {
  id: string;
  createdAt: string;
  // ... otras propiedades
}

const reservations: Reservation[] = response.data || [];
const sorted = reservations.sort((a, b) => {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
});
```

---

## 🚫 Anti-Pattern #4: Catch sin tipo

### ❌ MAL

```typescript
try {
  const response = await api.get('/apartments');
  return response.data;
} catch (error: any) {
  throw error;
}
```

### ✅ BIEN

```typescript
try {
  const response = await api.get<ApiResponse<Apartment[]>>('/apartments');
  return response.data;
} catch (error) {
  if (error instanceof Error) {
    console.error('Error fetching apartments:', error.message);
  }
  throw error;
}
```

---

## ✅ Checklist para Code Review

### Tipos:
- [ ] ¿Se evita el uso de `any`?
- [ ] ¿Las respuestas HTTP están tipadas con `ApiResponse<T>`?
- [ ] ¿Los eventos del DOM están tipados correctamente?
- [ ] ¿Los validadores usan tipos de Angular (`AbstractControl`, `ValidationErrors`)?
- [ ] ¿Los arrays tienen tipos específicos en lugar de `any[]`?
- [ ] ¿Los servicios tienen tipos de entrada y salida?

### Interfaces:
- [ ] ¿Las interfaces están en `core/models/`?
- [ ] ¿Hay interfaces separadas para DTOs (Create, Update, Response)?
- [ ] ¿Las interfaces coinciden con los DTOs del backend?
- [ ] ¿Se exportan las interfaces desde `index.ts`?

### Código:
- [ ] ¿Se usan type guards en lugar de type assertions?
- [ ] ¿Los catch blocks manejan errores correctamente?
- [ ] ¿Las declaraciones globales tienen tipos?

---

## 📝 Reglas de Oro

1. **NUNCA uses `any`** - Siempre define interfaces o tipos específicos
2. **Crea interfaces para TODAS las respuestas API** - Usa `ApiResponse<T>`
3. **Organiza interfaces en `core/models/`** - Un archivo por entidad
4. **Usa tipos de Angular** - `AbstractControl`, `ValidationErrors`, etc.
5. **Tipa eventos del DOM** - `Event`, `MouseEvent`, `KeyboardEvent`, etc.
6. **Instala `@types`** - Para librerías de terceros
7. **Usa type guards** - En lugar de type assertions cuando sea posible

---

## 🎯 Beneficios del Tipado Fuerte

1. **Autocompletado**: El IDE sugiere propiedades y métodos
2. **Detección temprana de errores**: Errores en tiempo de compilación, no en runtime
3. **Refactoring seguro**: Cambios se propagan automáticamente
4. **Documentación**: Los tipos documentan el código
5. **Mantenibilidad**: Código más fácil de entender y mantener
6. **Menos bugs**: TypeScript previene muchos errores comunes

---

**IMPORTANTE**: El uso de `any` debe ser excepcional y justificado. En el 99% de los casos, hay una alternativa mejor con tipos específicos.

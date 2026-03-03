# CondoFlow Mobile App

Aplicación móvil React Native con Expo para el sistema CondoFlow.

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- Expo CLI
- Expo Go app en tu dispositivo móvil (iOS/Android)

### Instalación

```bash
cd mobile-app/condoflow-mobile
npm install
```

### Ejecutar en Desarrollo

```bash
# Iniciar el servidor de desarrollo
npm start

# O específicamente para Android
npm run android

# O específicamente para iOS (requiere macOS)
npm run ios

# O para web
npm run web
```

### Escanear QR con Expo Go

1. Ejecuta `npm start`
2. Abre Expo Go en tu dispositivo
3. Escanea el código QR que aparece en la terminal

## 📱 Funcionalidades (Fase 1 - MVP)

### ✅ Implementadas
1. **Login/Register** - Autenticación de usuarios
2. **Ver mis deudas** - Lista de deudas mensuales con estados
3. **Hacer pagos** - Subir comprobante de pago (galería o cámara)
4. **Ver historial de pagos** - Lista de pagos con estados de aprobación
5. **Notificaciones push** - Preparado para notificaciones en tiempo real

## 🛠️ Tecnologías

- **React Native** con Expo
- **TypeScript**
- **React Navigation** - Navegación entre pantallas
- **Axios** - Cliente HTTP para API
- **AsyncStorage** - Almacenamiento local
- **Expo Image Picker** - Selección de imágenes
- **SignalR** - Notificaciones en tiempo real (preparado)

## 📁 Estructura del Proyecto

```
src/
├── config/           # Configuración de API
├── context/          # Context API (Auth)
├── navigation/       # Navegación de la app
├── screens/          # Pantallas de la app
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── DebtsScreen.tsx
│   ├── PaymentsScreen.tsx
│   └── CreatePaymentScreen.tsx
├── services/         # Servicios de API
│   ├── api.service.ts
│   ├── auth.service.ts
│   ├── debt.service.ts
│   ├── payment.service.ts
│   └── storage.service.ts
└── types/            # TypeScript types
```

## 🔧 Configuración

### API URL

Edita `src/config/api.config.ts` para cambiar la URL del backend:

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:7009/api', // Cambiar para producción
  SIGNALR_HUB_URL: 'http://localhost:7009/notificationHub',
  TIMEOUT: 30000,
};
```

**Nota**: Para probar en dispositivo físico, usa la IP local de tu computadora en lugar de `localhost`.

## 📸 Características Principales

### Autenticación
- Login con email y contraseña
- Registro de nuevos usuarios
- Almacenamiento seguro de tokens JWT
- Auto-login al abrir la app

### Gestión de Deudas
- Lista de deudas mensuales
- Estados: Pendiente, Pagada, Vencida, Parcial
- Colores distintivos por estado
- Pull-to-refresh para actualizar

### Pagos
- Subir comprobante desde galería
- Tomar foto con cámara
- Registro de monto y fecha
- Historial completo de pagos
- Estados: Pendiente, Aprobado, Rechazado

## 🔐 Seguridad

- Tokens JWT almacenados de forma segura
- Interceptor automático para agregar token a requests
- Auto-logout en caso de token expirado
- Validación de permisos de cámara y galería

## 🚧 Próximas Fases

### Fase 2
- Ver anuncios del condominio
- Actualizar perfil de usuario
- Reportar incidentes con fotos
- Hacer reservaciones de áreas comunes
- Participar en encuestas

## 📝 Scripts Disponibles

```bash
npm start          # Iniciar servidor de desarrollo
npm run android    # Ejecutar en Android
npm run ios        # Ejecutar en iOS
npm run web        # Ejecutar en navegador
npm test           # Ejecutar tests
```

## 🐛 Troubleshooting

### No se conecta al backend
- Verifica que el backend esté corriendo en `http://localhost:7009`
- Si usas dispositivo físico, cambia `localhost` por la IP de tu PC
- Verifica que estén en la misma red WiFi

### Error al subir imágenes
- Verifica permisos de cámara y galería
- Asegúrate de que el backend acepte base64

### App no carga después de cambios
- Limpia caché: `expo start -c`
- Reinstala dependencias: `rm -rf node_modules && npm install`

## 📄 Licencia

Este proyecto es privado y confidencial.

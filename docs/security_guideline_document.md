# Plan de Implementación Paso a Paso para Calixo PWA

A continuación se presenta un plan de alto nivel dividido en fases que cubre tanto aspectos funcionales como de seguridad y calidad. Cada fase incluye tareas con recomendaciones de seguridad integradas.

---

## 1. Preparación del Proyecto y Entorno

### Tareas
- Inicializar repositorio Git (branch protection, pull requests obligatorios).
- Configurar monorepo (si aplica) para frontend/backend.
- Establecer CI/CD básico en GitHub Actions o similar.
  - Ejecutar linting, formateo (Prettier, ESLint), build y tests.
- Crear archivos de configuración:
  - `.env.example` con variables necesarias (sin valores reales).
  - `tsconfig.json`, `next.config.js`, `drizzle.config.ts`.
- Configurar Docker:
  - Dockerfile para frontend y backend.
  - docker-compose para desarrollo local.

### Seguridad
- Proteger branches principales (main/master). Revisión de código obligatoria.
- Usar lockfiles (`package-lock.json`). Auditar dependencias con `npm audit` o SCA.
- No incluir secretos en el repositorio.

---

## 2. Autenticación y Gestión de Usuarios

### Tareas
- Integrar Supabase Auth:
  - Email/Password + Google OAuth.
  - Configurar reglas de base de datos (RLS) para perfiles.
- Implementar validación de contraseñas robusta (longitud mínima, complejidad).
- Almacenamiento seguro de contraseñas (bcrypt/Argon2 gestionado por Supabase).
- Crear flujo de registro, login, recuperación de contraseña.
- Definir roles: `normal`, `premium`, `admin`, `moderator`.
- Implementar RBAC en backend (Row-Level Security + policies).

### Seguridad
- Forzar HTTPS en todas las comunicaciones (Next.js `middleware`, HSTS).
- Validar inputs en el servidor usando Zod/Joi.
- Proteger cookies de sesión: `HttpOnly`, `Secure`, `SameSite=Lax`.
- Limitar intentos de login (rate limiting). Integrar reCAPTCHA si es necesario.

---

## 3. Configuración de Supabase y Drizzle ORM

### Tareas
- Diseñar el esquema de la base de datos:
  - Tablas: `users`, `profiles`, `challenges`, `sessions`, `transactions`, `follows`, `reports`, `config`.
  - Campos de auditoría: `created_at`, `updated_at`.
- Generar migraciones con Drizzle.
- Configurar Drizzle en backend para consultas seguras (SQL parametrizado).
- Crear endpoint `/api/config` público con valores leídos de la tabla `config`.

### Seguridad
- Habilitar Row-Level Security (RLS) y políticas mínimas.
- Conceder al servicio Next.js el mínimo privilegio en la base.
- Usar servicio de secretos para la URL y la key de Supabase (e.g., GitHub Secrets).

---

## 4. Gestión de Retos ("Retos")

### Tareas
- Endpoints REST/GraphQL para:
  - Crear/obtener retos (`daily`, `focus`, `social`).
  - Registrar eventos de sesión: `session_start`, `session_event`, `session_end`.
- Lógica de honor system:
  - Validar duración vs. visibilidad (visibilitychange).
  - Marcar retos completados o reiniciar.
- UI: Lista de retos, contadores de intentos, botones de inicio/parada.

### Seguridad
- Validar y sanitizar todos los payloads.
- Autorización: solo usuarios logueados y con rol adecuado pueden crear retos sociales.
- Prevenir spoofing de eventos: firmar tokens de sesión con JWT o HMAC.

---

## 5. Avatar CALI y Personalización

### Tareas
- Modelo de datos para atributos de avatar y nivel de energía.
- UI para seleccionar color y, eventualmente, desbloquear ropa/accesorios.
- Lógica de adquisición: compras con monedas o Premium.
- Endpoint para actualizar avatar.

### Seguridad
- Validar atributos permitidos (whitelist) en el servidor.
- Prevenir inyección de datos arbitrarios.

---

## 6. Moneda In-App y Store

### Tareas
- Diseño de la tabla `transactions` y `store_items`.
- Lógica de ganancia de monedas al completar retos.
- Endpoint para comprar ítems (deducción de monedas + asignación).
- UI tienda con filtros y estados de propiedad.

### Seguridad
- Comprobar saldo del usuario en el servidor antes de procesar la compra.
- Prevenir race conditions: usar transacciones DB.

---

## 7. Feed Social y Perfiles

### Tareas
- Endpoints para publicar retos completados (imagen + nota).
- Integrar Supabase Storage:
  - Reglas de bucket privadas.
  - Generación de URLs firmadas (expiración corta).
- Lógica de seguidores/following.
- Paginación de feed (cursor-based).

### Seguridad
- Validar tipo y tamaño de imagen en el servidor (<5 MB).
- Escanear uploads con antivirus (opcional).
- Prevenir XSS: sanitizar notas y escapar en render.

---

## 8. Suscripciones con Stripe

### Tareas
- Integrar Stripe Checkout para planes mensual/anual.
- Webhooks seguros en `/api/stripe/webhook`: verificar firma.
- Gestionar cupones:
  - Endpoints para aplicar/verificar.
- Actualizar rol a `premium` tras pago exitoso.

### Seguridad
- Proteger endpoint de webhook con `stripe-signature`.
- Validar datos del evento en servidor.

---

## 9. Notificaciones (In-App y Push)

### Tareas
- In-App: modelo `notifications`, endpoints GET/PUT (marcar como leído).
- Push Web:
  - Registrar suscripción en la DB.
  - Service Worker para recibir y mostrar push.
  - Backend que envía mensajes con VAPID.

### Seguridad
- Validar origen de suscripciones.
- Restringir payloads de notificación a campos permitidos.

---

## 10. Panel de Administración y Moderación

### Tareas
- UI toggle ADMIN/MODERATOR.
- ADMIN: CRUD de retos, rewards, configuración global, gestión de usuarios.
- MODERATOR: revisión de contenido reportado, acciones de moderación.
- Auditoría: registrar logs de acciones críticas.

### Seguridad
- Autorización estricta basada en roles.
- No exponer endpoints admin a usuarios normales.
- Monitoreo de cambios (alertas en caso de actividad inusual).

---

## 11. PWA, Service Worker y Experiencia Offline

### Tareas
- `manifest.json` con iconos, nombre, colores.
- Service Worker (Workbox/Stale-While-Revalidate) para:
  - Cache de assets estáticos.
  - Cache de datos de feed recientes.
- Página `/offline` amigable.

### Seguridad
- Establecer Content Security Policy (CSP) estricta.
- Habilitar Subresource Integrity (SRI) en recursos externos.

---

## 12. Accesibilidad, Internacionalización y QA

### Tareas
- WCAG 2.1 AA:
  - Roles ARIA, labels, navegación por teclado.
  - Contraste de colores, tamaño de texto.
- i18n:
  - Estructura de archivos (`next-i18next` o similar).
  - Preparar keys en español por defecto.
- Pruebas:
  - Unitarias (Jest), integración (React Testing Library).
  - E2E (Cypress) cubriendo flujos críticos.
- Auditoría de seguridad:
  - SAST/SCA.
  - Pentest básico en endpoints.

---

## 13. Despliegue y Mantenimiento

### Tareas
- Pipeline de CI/CD para producción:
  - Build optimizado, tests, despliegue automático.
- Monitorización:
  - Logs agregados (Sentry, Logflare).
  - Métricas de rendimiento y uso.
- Plan de actualizaciones:
  - Dependencias, parches de seguridad.
- Backups periódicos de la base de datos.

### Seguridad
- Deshabilitar modos debug en producción.
- Revisar configuraciones de TLS (al menos TLS 1.2+).
- Revisar y rotar secretos regularmente.

---

Este cronograma es adaptable según el tamaño del equipo y prioridades. Asegura una cobertura gradual de funcionalidades críticas, siempre reforzando la seguridad y la calidad en cada sprint.
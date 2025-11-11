# 📋 Características Pendientes - Calixo PWA

**Fecha:** 11 de noviembre, 2025  
**Estado del Proyecto:** 9/13 fases completadas (69.2%)

---

## 🎯 Resumen Ejecutivo

El proyecto Calixo PWA ha completado exitosamente **9 de 13 fases** planificadas. Las funcionalidades core están implementadas y funcionales:

### ✅ Implementado
- Sistema de autenticación completo (Email/Password + Google OAuth)
- Base de datos con 14 tablas y RLS policies
- Sistema de retos (diario, enfoque, social)
- Avatar CALI con personalización
- Tienda y sistema de monedas
- Feed social con interacciones
- Subscripciones con Stripe
- Sistema de notificaciones in-app

### ⏳ Pendiente
Restan **4 fases** para completar la versión 1.0 del producto:

1. **Fase 10:** Panel Admin (ALTA prioridad para producción)
2. **Fase 11:** PWA Features (CRÍTICA para funcionalidad offline)
3. **Fase 12:** Accessibility & i18n (MEDIA prioridad)
4. **Fase 13:** CI/CD & Deployment (ALTA prioridad para producción)

---

## 🚧 Fase 10: Panel Admin

**Prioridad:** 🔴 ALTA  
**Estado:** ⏳ PENDIENTE  
**Estimación:** ~2,500 líneas de código  
**Tiempo Estimado:** 2-3 días

### ¿Por qué es importante?
Sin el panel admin, no hay forma de:
- Gestionar los retos del catálogo
- Moderar contenido reportado
- Configurar parámetros del sistema
- Revisar subscripciones y cupones
- Gestionar usuarios problemáticos

### Características Pendientes

#### 1. Sistema de Roles Admin ⏳
```typescript
// db/schema.ts - Ya existe la tabla adminUsers
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(), // 'ADMIN' o 'MODERATOR'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Tareas:**
- [ ] API `/api/admin/check` - Verificar si el usuario tiene permisos admin
- [ ] Middleware para proteger rutas admin
- [ ] UI toggle entre modo ADMIN y MODERATOR
- [ ] Página principal del panel (`/admin`)

#### 2. CRUD de Retos ⏳
**Tareas:**
- [ ] API GET `/api/admin/challenges` - Listar todos los retos
- [ ] API POST `/api/admin/challenges` - Crear nuevo reto
- [ ] API PUT `/api/admin/challenges/[id]` - Editar reto existente
- [ ] API DELETE `/api/admin/challenges/[id]` - Eliminar reto
- [ ] Página `/admin/challenges` con tabla de retos
- [ ] Formulario de creación/edición
- [ ] Validación de campos (título, descripción, recompensa, tipo)

#### 3. Gestión de Usuarios ⏳
**Tareas:**
- [ ] API GET `/api/admin/users` - Listar usuarios con filtros
- [ ] API PUT `/api/admin/users/[id]/ban` - Banear usuario
- [ ] API PUT `/api/admin/users/[id]/warn` - Enviar advertencia
- [ ] API PUT `/api/admin/users/[id]/premium` - Toggle premium manual
- [ ] Página `/admin/users` con tabla y búsqueda
- [ ] Detalles de usuario (stats, historial, reportes)

#### 4. Cola de Moderación ⏳
**Tareas:**
- [ ] Tabla `reports` en schema (si no existe)
- [ ] API POST `/api/reports` - Reportar contenido (usuario)
- [ ] API GET `/api/admin/moderation/queue` - Listar reportes pendientes
- [ ] API PUT `/api/admin/moderation/[id]/resolve` - Resolver reporte
- [ ] API DELETE `/api/admin/feed/[id]` - Eliminar post del feed
- [ ] Página `/admin/moderation` con cola de reportes
- [ ] Acciones: Aprobar, Rechazar, Eliminar contenido, Advertir usuario

#### 5. Configuración del Sistema ⏳
**Tareas:**
- [ ] API GET `/api/admin/config` - Obtener configuración actual
- [ ] API PUT `/api/admin/config` - Actualizar parámetros
- [ ] Página `/admin/config` con formulario
- [ ] Parámetros configurables:
  - Límite de retos diarios (free/premium)
  - Recompensas por tipo de reto
  - Duración máxima de focus mode
  - Precio de items en tienda
  - Requisitos de desbloqueo de categorías

#### 6. Gestión de Cupones ⏳
**Tareas:**
- [ ] API GET `/api/admin/coupons` - Listar cupones
- [ ] API POST `/api/admin/coupons` - Crear cupón
- [ ] API PUT `/api/admin/coupons/[id]` - Editar cupón
- [ ] API DELETE `/api/admin/coupons/[id]` - Eliminar/expirar cupón
- [ ] Página `/admin/coupons` con tabla
- [ ] Formulario de creación (código, descuento %, fecha expiración, límite de usos)

#### 7. Dashboard de Subscripciones ⏳
**Tareas:**
- [ ] API GET `/api/admin/subscriptions/stats` - Estadísticas
- [ ] Página `/admin/subscriptions`
- [ ] Métricas: Usuarios premium, MRR, ARR, conversión, churn
- [ ] Listado de subscripciones activas/canceladas
- [ ] Logs de webhooks de Stripe

#### 8. Analytics Dashboard ⏳
**Tareas:**
- [ ] API GET `/api/admin/analytics` - Métricas generales
- [ ] Página `/admin/analytics`
- [ ] Métricas:
  - Usuarios activos (DAU, WAU, MAU)
  - Retos completados por tipo
  - Tasa de abandono de retos
  - Monedas ganadas vs gastadas
  - Items más comprados
  - Posts más populares
- [ ] Gráficos con Recharts o similar

### Archivos a Crear (Fase 10)
```
app/
├── admin/
│   ├── layout.tsx                          # Layout admin con sidebar
│   ├── page.tsx                            # Dashboard principal
│   ├── challenges/
│   │   ├── page.tsx                        # CRUD retos
│   │   └── [id]/edit/page.tsx              # Editar reto
│   ├── users/
│   │   ├── page.tsx                        # Gestión usuarios
│   │   └── [id]/page.tsx                   # Detalle usuario
│   ├── moderation/
│   │   └── page.tsx                        # Cola de moderación
│   ├── config/
│   │   └── page.tsx                        # Configuración
│   ├── coupons/
│   │   └── page.tsx                        # Gestión cupones
│   ├── subscriptions/
│   │   └── page.tsx                        # Dashboard subscriptions
│   └── analytics/
│       └── page.tsx                        # Analytics
├── api/
│   ├── admin/
│   │   ├── check/route.ts                  # Verificar permisos
│   │   ├── challenges/
│   │   │   ├── route.ts                    # GET/POST
│   │   │   └── [id]/route.ts               # PUT/DELETE
│   │   ├── users/
│   │   │   ├── route.ts                    # GET listar
│   │   │   └── [id]/
│   │   │       ├── ban/route.ts
│   │   │       ├── warn/route.ts
│   │   │       └── premium/route.ts
│   │   ├── moderation/
│   │   │   ├── queue/route.ts
│   │   │   └── [id]/resolve/route.ts
│   │   ├── config/route.ts                 # GET/PUT
│   │   ├── coupons/
│   │   │   ├── route.ts                    # GET/POST
│   │   │   └── [id]/route.ts               # PUT/DELETE
│   │   ├── subscriptions/
│   │   │   └── stats/route.ts
│   │   └── analytics/route.ts
│   └── reports/route.ts                    # POST (usuarios)
components/
└── admin/
    ├── admin-sidebar.tsx                   # Sidebar navegación
    ├── mode-toggle.tsx                     # ADMIN/MODERATOR switch
    ├── challenge-form.tsx                  # Formulario retos
    ├── user-table.tsx                      # Tabla usuarios
    ├── moderation-queue.tsx                # Cola de reportes
    ├── config-form.tsx                     # Formulario config
    ├── coupon-form.tsx                     # Formulario cupones
    └── analytics-chart.tsx                 # Gráficos
lib/
└── permissions.ts                          # Helper para verificar roles
```

**Total Estimado:** ~16 archivos nuevos, ~2,500 líneas

---

## 📱 Fase 11: PWA Features

**Prioridad:** 🔴 CRÍTICA  
**Estado:** 🟡 PARCIAL (manifest.json existe)  
**Estimación:** ~1,800 líneas de código  
**Tiempo Estimado:** 2 días

### ¿Por qué es crítico?
El proyecto se llama "Calixo **PWA**" pero actualmente **NO funciona como PWA**:
- ❌ No funciona offline
- ❌ No se puede instalar en el home screen
- ❌ No cachea contenido
- ❌ No hay Service Worker

### Estado Actual
```diff
+ ✅ manifest.json creado y configurado
+ ✅ Theme colors definidos
+ ✅ Icons paths (pero icons no existen aún)
- ❌ Service Worker NO implementado
- ❌ Offline page NO existe
- ❌ Cache strategies NO implementadas
- ❌ Install prompt NO configurado
- ❌ Background sync NO implementado
```

### Características Pendientes

#### 1. Service Worker con Workbox ⏳
**Tareas:**
- [ ] Instalar dependencias: `npm install workbox-webpack-plugin workbox-window`
- [ ] Configurar `next.config.ts` con Workbox plugin
- [ ] Crear `/public/sw.js` base
- [ ] Configurar cache strategies:
  - **App Shell:** Precache (HTML, CSS, JS, fonts)
  - **Assets estáticos:** Cache-First (imágenes, icons)
  - **API Feed:** StaleWhileRevalidate (mostrar cache mientras recarga)
  - **API Challenges:** NetworkFirst (priorizar red, fallback a cache)
  - **Supabase Storage:** CacheFirst con TTL
- [ ] Registrar SW en `app/layout.tsx`
- [ ] Agregar `workbox-config.js`

```typescript
// workbox-config.js ejemplo
module.exports = {
  globDirectory: '.next/',
  globPatterns: [
    '**/*.{js,css,html,png,jpg,svg,woff2}',
  ],
  swDest: 'public/sw.js',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'supabase-storage',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
        },
      },
    },
    {
      urlPattern: /^\/api\/feed/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-feed',
        expiration: {
          maxEntries: 20,
        },
      },
    },
  ],
};
```

#### 2. Offline Page ⏳
**Tareas:**
- [ ] Crear `app/offline/page.tsx`
- [ ] Diseñar UI amigable con ilustración
- [ ] Mostrar contenido cacheado disponible
- [ ] Botón "Reintentar conexión"
- [ ] Listar funcionalidades disponibles offline:
  - Ver feed cacheado
  - Ver perfil propio
  - Ver avatares guardados
  - Ver historial de transacciones
- [ ] Actualizar SW para redirigir a `/offline` cuando no hay red

#### 3. Install Prompt ⏳
**Tareas:**
- [ ] Crear `components/install-prompt.tsx`
- [ ] Detectar evento `beforeinstallprompt`
- [ ] Mostrar banner/modal de instalación
- [ ] Personalizar mensaje: "Instala Calixo en tu pantalla de inicio"
- [ ] Botón "Instalar" y "Ahora no"
- [ ] Guardar preferencia en localStorage
- [ ] Mostrar solo 1 vez o después de X días
- [ ] Integrar en layout o dashboard

#### 4. Background Sync ⏳
**Tareas:**
- [ ] Implementar Background Sync API en SW
- [ ] Queue de acciones pendientes cuando offline:
  - Completar reto
  - Dar like
  - Comentar
  - Seguir usuario
  - Comprar item
- [ ] Crear tabla `syncQueue` en IndexedDB
- [ ] Sincronizar automáticamente cuando vuelva la red
- [ ] Mostrar notificación al usuario de acciones pendientes

#### 5. Generación de Icons PWA ⏳
**Tareas:**
- [ ] Crear icon base 512x512 (logo Calixo)
- [ ] Generar todos los tamaños: 72, 96, 128, 144, 152, 192, 384, 512
- [ ] Crear versión maskable (safe zone)
- [ ] Guardar en `/public/icons/`
- [ ] Actualizar `manifest.json` con rutas correctas
- [ ] Crear screenshots para app stores:
  - Desktop: 1920x1080
  - Mobile: 750x1334

#### 6. Pruebas PWA ⏳
**Tareas:**
- [ ] Ejecutar Lighthouse audit (PWA score > 90)
- [ ] Verificar instalación en Chrome/Edge/Safari
- [ ] Probar offline mode completo
- [ ] Verificar cache strategies funcionan
- [ ] Probar background sync
- [ ] Validar comportamiento en iOS vs Android
- [ ] Verificar splash screen personalizada
- [ ] Comprobar que manifest.json es válido

### Archivos a Crear/Modificar (Fase 11)
```
public/
├── sw.js                                   # Service Worker generado
├── workbox-*.js                            # Runtime de Workbox
├── offline.html                            # Fallback HTML
└── icons/
    ├── icon-72x72.png                      # Todos los tamaños
    ├── icon-96x96.png
    ├── ...
    └── icon-512x512.png
app/
├── offline/
│   └── page.tsx                            # Página offline
└── layout.tsx                              # ✏️ Registrar SW
components/
└── install-prompt.tsx                      # Prompt instalación
lib/
├── sw-register.ts                          # Helper registro SW
└── sync-queue.ts                           # Queue para background sync
workbox-config.js                           # Configuración Workbox
next.config.ts                              # ✏️ Agregar Workbox plugin
```

**Total Estimado:** ~12 archivos nuevos, ~1,800 líneas

---

## ♿ Fase 12: Accessibility & i18n

**Prioridad:** 🟡 MEDIA  
**Estado:** ⏳ PENDIENTE  
**Estimación:** ~800 líneas de código + auditoría  
**Tiempo Estimado:** 1-2 días

### ¿Por qué es importante?
- **Legal:** WCAG 2.1 AA es requerido en muchas jurisdicciones
- **Inclusión:** 15% de la población mundial tiene alguna discapacidad
- **SEO:** Mejores prácticas de accesibilidad mejoran el ranking
- **UX:** Navegación por teclado beneficia a todos los usuarios
- **Expansión:** i18n permite traducir a otros idiomas fácilmente

### Características Pendientes

#### 1. Auditoría de Accesibilidad ⏳
**Tareas:**
- [ ] Instalar `@axe-core/react`
- [ ] Ejecutar audit en todas las páginas
- [ ] Generar reporte de violaciones
- [ ] Priorizar por severidad (critical > serious > moderate)
- [ ] Crear documento `ACCESSIBILITY_AUDIT.md` con hallazgos

#### 2. Correcciones WCAG 2.1 AA ⏳

**Contraste de Colores:**
- [ ] Verificar ratio de contraste ≥ 4.5:1 en todos los textos
- [ ] Actualizar colores que no cumplan (neutral-gray, soft-blue)
- [ ] Agregar variants de botones con mejor contraste

**Navegación por Teclado:**
- [ ] Verificar que TODOS los elementos interactivos son accesibles con Tab
- [ ] Agregar `focus-visible` styles personalizados
- [ ] Implementar `skip to main content` link
- [ ] Verificar orden de tab lógico
- [ ] Agregar shortcuts de teclado:
  - `Ctrl+K` → Búsqueda
  - `N` → Nueva notificación
  - `C` → Crear reto
  - `?` → Mostrar atajos

**ARIA Labels:**
- [ ] Agregar `aria-label` a todos los iconos sin texto
- [ ] Usar `aria-describedby` en formularios
- [ ] Agregar `aria-live` regions para notificaciones
- [ ] Usar `role="status"` en toasts
- [ ] Agregar `aria-expanded` en dropdowns
- [ ] Usar `aria-current="page"` en nav activo

**Formularios:**
- [ ] Asociar `<label>` con cada `<input>`
- [ ] Agregar `aria-required` en campos obligatorios
- [ ] Mostrar errores con `aria-invalid` y `aria-errormessage`
- [ ] Mejorar instrucciones de ayuda

**Imágenes:**
- [ ] Agregar `alt` descriptivos a todas las imágenes
- [ ] Usar `alt=""` en imágenes decorativas
- [ ] Agregar `aria-hidden="true"` a SVGs decorativos

**Modales y Dialogs:**
- [ ] Usar `<dialog>` o `role="dialog"`
- [ ] Implementar focus trap
- [ ] Cerrar con `Esc`
- [ ] Retornar focus al elemento que lo abrió

**Prefers-Reduced-Motion:**
- [ ] Detectar `prefers-reduced-motion`
- [ ] Desactivar animaciones si está activado
- [ ] Agregar toggle en Settings

#### 3. Testing con Screen Readers ⏳
**Tareas:**
- [ ] Probar con NVDA (Windows)
- [ ] Probar con JAWS (Windows)
- [ ] Probar con VoiceOver (macOS/iOS)
- [ ] Probar con TalkBack (Android)
- [ ] Documentar problemas encontrados
- [ ] Corregir navegación confusa

#### 4. Configuración de i18n ⏳
**Tareas:**
- [ ] Instalar `next-intl` o `next-i18next`
- [ ] Configurar `i18n.config.ts`
- [ ] Crear carpeta `/locales/`
- [ ] Crear archivos de traducción:
  - `/locales/es/common.json` (español por defecto)
  - `/locales/en/common.json` (inglés preparado)
- [ ] Extraer todos los textos a archivos de traducción
- [ ] Crear helper `useTranslation()`
- [ ] Agregar selector de idioma en Settings
- [ ] Configurar Next.js para i18n routing

```typescript
// i18n.config.ts ejemplo
export const i18n = {
  defaultLocale: 'es',
  locales: ['es', 'en'],
  localeDetection: true,
};
```

```json
// /locales/es/common.json
{
  "nav": {
    "feed": "Feed",
    "challenges": "Retos",
    "store": "Tienda",
    "profile": "Perfil"
  },
  "challenges": {
    "daily": "Retos Diarios",
    "focus": "Modo Enfoque",
    "social": "Retos Sociales",
    "start": "Iniciar Reto",
    "complete": "Completar"
  }
}
```

#### 5. Componentes Accesibles ⏳
**Tareas:**
- [ ] Crear `components/a11y/SkipLink.tsx`
- [ ] Crear `components/a11y/ScreenReaderOnly.tsx`
- [ ] Crear `components/a11y/FocusTrap.tsx`
- [ ] Actualizar todos los componentes con mejores prácticas
- [ ] Agregar `VisuallyHidden` para texto solo screen reader

### Archivos a Crear/Modificar (Fase 12)
```
locales/
├── es/
│   ├── common.json
│   ├── challenges.json
│   ├── store.json
│   └── errors.json
└── en/
    ├── common.json
    ├── challenges.json
    ├── store.json
    └── errors.json
components/
└── a11y/
    ├── SkipLink.tsx
    ├── ScreenReaderOnly.tsx
    └── FocusTrap.tsx
lib/
├── i18n.ts                                 # Configuración i18n
└── accessibility.ts                        # Helpers a11y
docs/
├── ACCESSIBILITY_AUDIT.md                  # Reporte de auditoría
└── I18N_GUIDE.md                           # Guía de traducción
i18n.config.ts                              # Configuración
next.config.ts                              # ✏️ Agregar i18n
app/
└── [locale]/                               # ✏️ Reestructurar rutas
```

**Total Estimado:** ~8 archivos nuevos, ~800 líneas + auditoría

---

## 🚀 Fase 13: CI/CD & Deployment

**Prioridad:** 🔴 ALTA (para producción)  
**Estado:** ⏳ PENDIENTE  
**Estimación:** ~600 líneas de código + configuración  
**Tiempo Estimado:** 1 día

### ¿Por qué es importante?
Sin CI/CD:
- ❌ Deploys manuales propensos a errores
- ❌ Sin testing automatizado
- ❌ Sin linting automático
- ❌ Sin deployment previews
- ❌ Sin monitoreo de errores

### Características Pendientes

#### 1. GitHub Actions Workflows ⏳
**Tareas:**
- [ ] Crear `.github/workflows/ci.yml`
- [ ] Workflow de CI:
  - Ejecutar en cada PR
  - Install dependencies
  - Run linter (ESLint)
  - Run type check (tsc)
  - Run tests (si existen)
  - Check build
- [ ] Workflow de deployment:
  - Ejecutar en push a `main`
  - Deploy automático a Vercel/producción
- [ ] Agregar badges en README.md

```yaml
# .github/workflows/ci.yml ejemplo
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run build
```

#### 2. Testing Setup ⏳
**Tareas:**
- [ ] Instalar Jest + React Testing Library
- [ ] Configurar `jest.config.js`
- [ ] Crear `setupTests.ts`
- [ ] Escribir tests básicos:
  - Componentes UI (Button, Card)
  - Auth forms validation
  - API routes (mocks)
  - Utils functions
- [ ] Agregar script `npm run test`
- [ ] Configurar coverage reporting
- [ ] Objetivo: >80% coverage en utils/lib

#### 3. Linting en CI ⏳
**Tareas:**
- [ ] Verificar `.eslintrc.json` completo
- [ ] Agregar reglas estrictas:
  - `no-console` en producción
  - `@typescript-eslint/no-explicit-any`
  - `react-hooks/exhaustive-deps`
- [ ] Configurar Prettier
- [ ] Agregar `.prettierrc`
- [ ] Script `npm run format`
- [ ] Pre-commit hook con Husky (opcional)

#### 4. Vercel Deployment ⏳
**Tareas:**
- [ ] Crear cuenta en Vercel (si no existe)
- [ ] Conectar repositorio GitHub
- [ ] Configurar variables de entorno en Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DATABASE_URL`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `APP_ENV=PRO`
  - `NEXT_PUBLIC_APP_URL`
- [ ] Configurar dominios:
  - Dominio principal
  - Preview deployments para PRs
- [ ] Configurar `vercel.json` (si necesario)
- [ ] Agregar redirect rules
- [ ] Configurar headers de seguridad

```json
// vercel.json ejemplo
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

#### 5. Monitoring con Sentry ⏳
**Tareas:**
- [ ] Crear cuenta en Sentry
- [ ] Instalar `@sentry/nextjs`
- [ ] Configurar `sentry.client.config.ts`
- [ ] Configurar `sentry.server.config.ts`
- [ ] Agregar `sentry.edge.config.ts`
- [ ] Configurar source maps upload
- [ ] Agregar error boundary en layout
- [ ] Test error tracking
- [ ] Configurar alertas en Sentry:
  - Errores críticos → Slack/Email
  - Performance issues
  - Release tracking

#### 6. Environment Management ⏳
**Tareas:**
- [ ] Documentar todas las env vars en `.env.example`
- [ ] Crear guía de deployment
- [ ] Configurar diferentes entornos:
  - Development (local)
  - Preview (Vercel previews)
  - Production (main branch)
- [ ] Separar configs por entorno si necesario
- [ ] Validar env vars al build con Zod

```typescript
// lib/env.ts ejemplo
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  APP_ENV: z.enum(['PRE', 'PRO']),
});

export const env = envSchema.parse(process.env);
```

#### 7. Documentation para Deploy ⏳
**Tareas:**
- [ ] Crear `docs/deployment/DEPLOYMENT_GUIDE.md`
- [ ] Documentar proceso completo de deploy
- [ ] Checklist pre-deploy:
  - [ ] Migraciones de BD aplicadas
  - [ ] Env vars configuradas
  - [ ] Stripe webhooks actualizados
  - [ ] DNS configurado
  - [ ] SSL activo
  - [ ] Monitoreo activo
- [ ] Procedimientos de rollback
- [ ] Troubleshooting común

### Archivos a Crear/Modificar (Fase 13)
```
.github/
└── workflows/
    ├── ci.yml                              # CI pipeline
    ├── deploy.yml                          # Deploy pipeline
    └── pr-preview.yml                      # Preview deployments
tests/
├── setup.ts                                # Test setup
├── components/
│   └── Button.test.tsx                     # Tests componentes
├── lib/
│   └── utils.test.ts                       # Tests utils
└── api/
    └── challenges.test.ts                  # Tests API
lib/
├── env.ts                                  # Validación env vars
└── sentry.ts                               # Sentry helpers
docs/
└── deployment/
    ├── DEPLOYMENT_GUIDE.md
    ├── VERCEL_SETUP.md
    └── SENTRY_SETUP.md
sentry.client.config.ts                     # Sentry client
sentry.server.config.ts                     # Sentry server
sentry.edge.config.ts                       # Sentry edge
jest.config.js                              # Jest config
.prettierrc                                 # Prettier config
vercel.json                                 # Vercel config
```

**Total Estimado:** ~15 archivos nuevos, ~600 líneas

---

## 📊 Resumen de Esfuerzo

| Fase | Prioridad | Archivos Nuevos | Líneas Est. | Tiempo Est. | Blocker |
|------|-----------|-----------------|-------------|-------------|---------|
| **Fase 10: Admin Panel** | 🔴 ALTA | ~16 | ~2,500 | 2-3 días | ❌ No |
| **Fase 11: PWA Features** | 🔴 CRÍTICA | ~12 | ~1,800 | 2 días | ❌ No |
| **Fase 12: Accessibility & i18n** | 🟡 MEDIA | ~8 | ~800 | 1-2 días | ❌ No |
| **Fase 13: CI/CD & Deploy** | 🔴 ALTA | ~15 | ~600 | 1 día | ❌ No |
| **TOTAL** | - | **~51** | **~5,700** | **6-8 días** | ✅ Independientes |

---

## 🎯 Recomendación de Implementación

### Opción 1: Enfoque MVP para Producción Rápida
Si el objetivo es **lanzar a producción lo antes posible**:

1. **Fase 11: PWA Features** (2 días) - CRÍTICO
   - Sin esto, no es realmente una PWA
2. **Fase 13: CI/CD & Deploy** (1 día) - CRÍTICO
   - Necesario para deploy seguro
3. **Fase 10: Admin Panel** (2-3 días) - ALTA
   - Necesario para gestionar contenido
4. **Fase 12: Accessibility** (1-2 días después del launch) - MEDIA
   - Importante pero no bloqueante inicial

**Timeline:** 5-6 días de desarrollo → **Lanzamiento**

### Opción 2: Enfoque Completo Antes de Producción
Si el objetivo es **lanzar con todas las características**:

1. **Fase 11: PWA Features** (2 días)
2. **Fase 10: Admin Panel** (2-3 días)
3. **Fase 12: Accessibility & i18n** (1-2 días)
4. **Fase 13: CI/CD & Deploy** (1 día)

**Timeline:** 6-8 días de desarrollo → **Lanzamiento**

---

## 🚦 Criterios de Aceptación para v1.0

### Must Have (Bloqueantes para v1.0)
- ✅ Sistema de autenticación funcional
- ✅ Retos diarios, enfoque y sociales operativos
- ✅ Avatar CALI con personalización
- ✅ Tienda y monedas funcionando
- ✅ Feed social con interacciones
- ✅ Subscripciones Stripe integradas
- ✅ Notificaciones in-app
- ⏳ **Service Worker con cache offline** (Fase 11)
- ⏳ **Install prompt PWA** (Fase 11)
- ⏳ **Panel Admin básico** (Fase 10)
- ⏳ **CI/CD pipeline** (Fase 13)
- ⏳ **Deploy en Vercel** (Fase 13)

### Should Have (Importantes pero no bloqueantes)
- ⏳ **Background sync** (Fase 11)
- ⏳ **Auditoría WCAG 2.1 AA** (Fase 12)
- ⏳ **Analytics dashboard** (Fase 10)
- ⏳ **Error monitoring con Sentry** (Fase 13)

### Nice to Have (Para v1.1+)
- ⏳ Multi-idioma completo (Fase 12)
- Tests comprehensivos (Fase 13)
- Modo oscuro
- Gamificación avanzada
- Deep links para compartir

---

## 📝 Notas Importantes

### Deuda Técnica Actual
1. **No hay tests** - Toda la lógica de negocio está sin tests
2. **No hay error tracking** - Errores en producción pasarán desapercibidos
3. **PWA no funcional** - Dice ser PWA pero no lo es completamente
4. **Sin gestión de contenido** - No hay forma de moderar ni administrar

### Riesgos para Producción Sin Fases Pendientes
- **Sin Fase 11 (PWA):** App no funciona offline, mala UX
- **Sin Fase 10 (Admin):** Imposible gestionar contenido reportado
- **Sin Fase 13 (CI/CD):** Deploys manuales, errores no detectados
- **Sin Fase 12 (A11y):** Posibles problemas legales, mala accesibilidad

---

## ✅ Conclusión

El proyecto Calixo PWA tiene una **base sólida** con 9 fases completadas (69.2%). Las funcionalidades core están implementadas y funcionan correctamente.

**Para considerarse "Listo para Producción v1.0"**, se necesitan completar:
- **Obligatorio:** Fases 10, 11, y 13 (5-6 días)
- **Recomendado:** Fase 12 también (1-2 días adicionales)

**Total para v1.0 completa:** 6-8 días de desarrollo continuo

---

**Última Actualización:** 11 de noviembre, 2025  
**Próxima Revisión:** Después de completar Fase 10


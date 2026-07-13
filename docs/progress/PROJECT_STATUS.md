# Calixo PWA — Estado del Proyecto

> Auditoría basada en revisión del código fuente (julio 2026).  
> La documentación anterior declaraba 13/13 fases al 100%; esta versión refleja el estado **real** verificado en el repositorio.

---

## Progreso general del proyecto

```
████████████████░░░░░░░░░░░░░░░░░░░░  65%
```

| Métrica | Valor |
|---------|-------|
| **Progreso global** | **65%** |
| **Estado** | 🟡 MVP avanzado — no listo para producción sin cerrar brechas |
| **Fases documentadas** | 13 (con distintos grados de completitud) |
| **API routes** | ~67 endpoints |
| **Componentes React** | ~80+ |
| **Tests automatizados** | 0 |
| **Última revisión** | Julio 2026 |

---

## Dashboard por módulo

| # | Módulo | Progreso | Estado |
|---|--------|----------|--------|
| 1 | [Setup del proyecto](#1-setup-del-proyecto) | `████████░░` **82%** | 🟡 |
| 2 | [Autenticación](#2-autenticación) | `████████░░` **78%** | 🟡 |
| 3 | [Base de datos](#3-base-de-datos) | `█████░░░░░` **52%** | 🔴 |
| 4 | [Retos / Challenges](#4-retos--challenges) | `███████░░░` **74%** | 🟡 |
| 5 | [Avatar CALI](#5-avatar-cali) | `██████░░░░` **62%** | 🟡 |
| 6 | [Tienda y monedas](#6-tienda-y-monedas) | `███████░░░` **72%** | 🟡 |
| 7 | [Feed social](#7-feed-social) | `████████░░` **78%** | 🟡 |
| 8 | [Suscripciones Stripe](#8-suscripciones-stripe) | `████████░░` **84%** | 🟢 |
| 9 | [Notificaciones](#9-notificaciones) | `█████░░░░░` **52%** | 🔴 |
| 10 | [Panel Admin](#10-panel-admin) | `████████░░` **86%** | 🟢 |
| 11 | [PWA](#11-pwa) | `██████░░░░` **58%** | 🟡 |
| 12 | [Accesibilidad (a11y)](#12-accesibilidad-a11y) | `███░░░░░░░` **32%** | 🔴 |
| 13 | [i18n](#13-internacionalización-i18n) | `░░░░░░░░░░` **5%** | 🔴 |
| 14 | [CI/CD y deployment](#14-cicd-y-deployment) | `███████░░░` **74%** | 🟡 |
| 15 | [Testing](#15-testing) | `░░░░░░░░░░` **0%** | 🔴 |
| 16 | [Páginas legales](#16-páginas-legales) | `███████░░░` **68%** | 🟡 |
| 17 | [Cupones](#17-cupones) | `████████░░` **88%** | 🟢 |
| 18 | [Perfil de usuario](#18-perfil-de-usuario) | `████████░░` **84%** | 🟢 |
| 19 | [Documentación](#19-documentación) | `██████░░░░` **58%** | 🟡 |

**Leyenda:** 🟢 ≥ 80% · 🟡 50–79% · 🔴 < 50%

---

## Progreso por fases documentadas

```
Fase  1  Setup              ████████░░  82%
Fase  2  Autenticación      ████████░░  78%
Fase  3  Base de datos       █████░░░░░  52%
Fase  4  Retos               ███████░░░  74%
Fase  5  Avatar CALI         ██████░░░░  62%
Fase  6  Tienda y monedas    ███████░░░  72%
Fase  7  Feed social         ████████░░  78%
Fase  8  Stripe              ████████░░  84%
Fase  9  Notificaciones      █████░░░░░  52%
Fase 10  Panel Admin          ████████░░  86%
Fase 11  PWA                  ██████░░░░  58%
Fase 12  A11y + i18n          ██░░░░░░░░  19%  (a11y 32% · i18n 5%)
Fase 13  CI/CD                ███████░░░  74%
```

**Promedio ponderado de fases:** ~66%

---

## Detalle por módulo

### 1. Setup del proyecto

```
████████░░  82%
```

**Implementado:**
- Next.js 16 + React 19 + TypeScript + App Router
- Tailwind CSS 3.4, shadcn/ui base, ESLint, Prettier
- Validación de env con Zod (`lib/env.ts`)
- `.env.example`, scripts `dev`, `build`, `lint`, `type-check`, `format`

**Pendiente / desalineado:**
- `lib/env.ts` no se importa en runtime (validación inactiva)
- `workbox-webpack-plugin` en dependencias pero sin uso
- Script `npm run db:seed` apunta a `db/seed.ts` que **no existe**
- README raíz aún menciona Next.js 14 y Drizzle ORM

---

### 2. Autenticación

```
████████░░  78%
```

**Implementado:**
- Login email/username + contraseña, signup multistep, verify-email
- Google OAuth + callback SSR (`app/auth/actions.ts`, `app/auth/callback/route.ts`)
- Middleware de sesión con rutas protegidas y redirect por email no verificado
- Validación Zod (`lib/validations/auth.ts`)

**Pendiente:**
- Página `/auth/reset-password/confirm` **no existe** (reset password incompleto)
- Rutas `/avatar`, `/search`, `/pricing` no protegidas en middleware
- Rol `moderator` en tipos pero sin lógica separada en BD

---

### 3. Base de datos

```
█████░░░░░  52%
```

**Implementado:**
- 6 migraciones versionadas en `supabase/migrations/`
- Tablas core: `users`, `challenges`, `user_challenges`, `feed_items`, `coupons`, `subscriptions`, `config`, etc.
- Cliente Supabase (`lib/supabase/db.ts`) reemplaza Drizzle
- Scripts SQL manuales en `docs/setup/`

**Pendiente / crítico:**
- Tablas usadas en código **sin migración**: `store_items`, `avatar_customizations`, `social_sessions`, `followers`, `follow_requests`, `notifications`, `feed_likes`, `user_coupons`
- RLS habilitado pero políticas concretas solo en SQL manual (`docs/setup/`)
- `db/seed.ts` inexistente; documentación de Drizzle obsoleta

---

### 4. Retos / Challenges

```
███████░░░  74%
```

**Implementado:**
- Retos diarios y modo enfoque: APIs `start`, `finish`, `claim`, `complete`, `fail`, `cancel`, `active`
- UI unificada en `app/challenges/page.tsx` con timer, modales y recompensas
- Selección diaria determinística, tracking visibilitychange

**Pendiente:**
- Retos sociales **rotos**: frontend envía email, API espera UUID (`app/challenges/social/page.tsx` TODO)
- Tabla `social_sessions` sin migración
- No usa `/api/users/search` para resolver invitaciones

---

### 5. Avatar CALI

```
██████░░░░  62%
```

**Implementado:**
- Editor en `app/avatar/page.tsx`, APIs `/api/avatar` y `/api/avatar/equip`
- 6 categorías, preview en tiempo real, unlock progresivo (`lib/avatar-unlock.ts`)
- Sistema de energía (`lib/avatar-energy.ts`)

**Pendiente:**
- Compra de items avatar **rota**: llama `/api/store/purchase` con `itemId` pero la API espera `couponId`
- Workaround desbloquea items sin descontar monedas
- Tablas `store_items` y `avatar_customizations` sin migración
- Preview básico (bloques CSS, no sprites reales)

---

### 6. Tienda y monedas

```
███████░░░  72%
```

**Implementado:**
- Tienda de cupones: `app/store/page.tsx`, purchased, transactions
- APIs: `/api/store`, `/api/store/purchase`, `/api/transactions`
- Monedas: earn en claim, bonus share, spend en cupones

**Pendiente:**
- Dos conceptos de tienda mezclados (cupones partners vs items avatar)
- `user_coupons` solo en SQL manual, no en migraciones
- Componentes legacy (`store-filters.tsx`, `store-item-card.tsx`) parcialmente muertos

---

### 7. Feed social

```
████████░░  78%
```

**Implementado:**
- Feed con paginación, likes, comentarios, followers, perfiles privados
- APIs: `/api/feed`, likes, comments, follow, reports, banners
- Búsqueda de usuarios, moderación de reportes, menciones

**Pendiente:**
- Depende de tablas no migradas: `followers`, `follow_requests`, `feed_likes`, `feed_comments`
- RLS de `feed_likes` solo en `docs/setup/CREATE_FEED_LIKES_TABLE.sql`

---

### 8. Suscripciones Stripe

```
████████░░  84%
```

**Implementado:**
- Pricing, subscription management, success page
- Checkout, webhooks (5 eventos), customer portal
- Modo PRE (premium simulado sin Stripe)
- Admin stats de suscripciones

**Pendiente:**
- Portal Stripe falla en modo PRE (subscription_id fake `pre_*`)
- Price IDs no validados centralmente en build

---

### 9. Notificaciones

```
█████░░░░░  52%
```

**Implementado:**
- Notificaciones in-app: página, badge con polling, mark read/all
- Creación automática en likes, follows, comments, invitaciones

**Pendiente:**
- Push notifications: handler en SW pero **sin suscripción cliente** (0 matches VAPID/PushManager)
- Tabla `notifications` sin migración versionada
- Energy decay cron no conectado

---

### 10. Panel Admin

```
████████░░  86%
```

**Implementado:**
- 15 páginas admin: dashboard, users, challenges CRUD, coupons CRUD + upload, banners, moderation, analytics, config, subscriptions
- 20+ API routes admin, layout con guard `is_admin`
- Componentes: sidebar, forms, moderation queue, stat cards

**Pendiente:**
- Rol `moderator` documentado pero sin columna separada en BD
- Check de rol solo en layout/API, no en middleware

---

### 11. PWA

```
██████░░░░  58%
```

**Implementado:**
- Service Worker completo (`public/sw.js`): precache, cache strategies, offline fallback
- Registro SW, página offline, manifest.json con shortcuts
- Script generador de iconos placeholder

**Pendiente:**
- Iconos PNG faltantes: solo `public/icons/icon.svg` (manifest referencia 8 PNG)
- Sin UI de install prompt (`beforeinstallprompt`)
- Background sync nunca invocado desde la app
- Workbox deps sin integrar; TODO toast de actualización SW

---

### 12. Accesibilidad (a11y)

```
███░░░░░░░  32%
```

**Implementado:**
- `SkipLink` en layout, estilos `sr-only`, `focus-visible`, `prefers-reduced-motion`
- Componentes: `FocusTrap`, `ScreenReaderOnly` (definidos)
- Algunos `aria-*` en nav, inputs, modales

**Pendiente:**
- `FocusTrap` y `ScreenReaderOnly` **no importados** en componentes de la app
- Modales sin focus trap consistente
- Sin auditoría automatizada (axe/Lighthouse)
- `viewport.maximumScale: 1` puede perjudicar zoom

---

### 13. Internacionalización (i18n)

```
░░░░░░░░░░  5%
```

**Implementado:**
- `html lang="es"`, textos hardcodeados en español

**Pendiente (documentado como completo pero inexistente):**
- `next-intl` **no está** en `package.json`
- Sin carpeta `locales/`, sin `i18n.config.ts`, sin `lib/i18n.ts`
- PHASE_12 afirma traducciones es/en — **0 archivos**

---

### 14. CI/CD y deployment

```
███████░░░  74%
```

**Implementado:**
- GitHub Actions: CI (lint, type-check, build) + Deploy a Vercel
- `vercel.json` con security headers
- Documentación de deployment completa

**Pendiente:**
- CI no ejecuta tests (no existen)
- CI referencia `DATABASE_URL` / Drizzle obsoleto
- `lib/env.ts` no integrado en pipeline

---

### 15. Testing

```
░░░░░░░░░░  0%
```

**Estado:** Sin tests. 0 archivos `*.test.*` / `*.spec.*`, sin script `test` en `package.json`, CI sin testing.

---

### 16. Páginas legales

```
███████░░░  68%
```

**Implementado:**
- 4 páginas: aviso legal, términos, privacidad, cookies
- Enlaces en footer

**Pendiente:**
- Placeholders legales: `B-XXXXXXXX`, dirección, teléfono
- Sin banner de consentimiento de cookies ni gestión real

---

### 17. Cupones

```
████████░░  88%
```

**Implementado (módulo más maduro):**
- Modelo en migración + setup SQL
- Tienda, compra con monedas, admin CRUD con upload de imagen
- Validación, página purchased con búsqueda

**Pendiente:**
- `user_coupons` fuera de migraciones versionadas
- Seed de cupones solo en SQL manual

---

### 18. Perfil de usuario

```
████████░░  84%
```

**Implementado:**
- Perfil propio y público/privado, foto con crop, settings, followers modal
- APIs completas: profile, photo, followers, following, challenges, feed, check-username
- Report user, búsqueda de usuarios

**Pendiente:**
- Foto de perfil depende de setup manual de Supabase Storage
- Posible desincronización signup vs settings

---

### 19. Documentación

```
██████░░░░  58%
```

**Existe:** 44+ archivos en `docs/`, índice, 13 resúmenes de fases, guías setup/deployment.

**Problemas de fiabilidad:**

| Documentación dice | Código real |
|--------------------|-------------|
| 13/13 fases al 100% | Múltiples brechas (ver arriba) |
| Drizzle ORM + `db/seed.ts` | No existe carpeta `db/` |
| next-intl + locales es/en | 0 archivos |
| Push notifications completas | Solo handler SW |
| Next.js 14 | Next.js 16 |
| Listo para producción | Requiere cerrar brechas críticas |

---

## Brechas críticas (prioridad)

| Prioridad | Brecha | Impacto |
|-----------|--------|---------|
| 🔴 P0 | Esquema BD fragmentado (tablas sin migración) | Features rotas en deploy limpio |
| 🔴 P0 | Retos sociales: email vs UUID | Invitaciones no funcionan |
| 🔴 P0 | Compra avatar vs cupones (API mismatch) | Economía de monedas inconsistente |
| 🟠 P1 | i18n documentada pero inexistente | Expectativa vs realidad |
| 🟠 P1 | 0 tests automatizados | Sin red de seguridad en CI |
| 🟠 P1 | Iconos PWA faltantes | No instalable en dispositivos |
| 🟡 P2 | Reset password incompleto | Flujo de recuperación roto |
| 🟡 P2 | `db:seed` roto | Onboarding de dev friccionado |

---

## Roadmap sugerido

### Corto plazo (bloqueantes producción)
- [ ] Consolidar migraciones Supabase (todas las tablas + RLS)
- [ ] Arreglar retos sociales (búsqueda user ID por email)
- [ ] Separar tienda avatar vs cupones o unificar API purchase
- [ ] Generar iconos PWA reales
- [ ] Completar flujo reset password

### Medio plazo (calidad)
- [ ] Suite de tests (Jest + RTL) con CI
- [ ] Implementar i18n real o eliminar referencias
- [ ] Integrar `FocusTrap` en modales; auditoría a11y
- [ ] Push notifications end-to-end
- [ ] Actualizar docs obsoletas (Drizzle, Next 14, 100%)

### Largo plazo (v1.1+)
- [ ] Error monitoring (Sentry)
- [ ] Modo oscuro
- [ ] Banner cookies + gestión consentimiento
- [ ] Gamificación avanzada
- [ ] Deep links

---

## Estadísticas del código (julio 2026)

| Métrica | Valor |
|---------|-------|
| Archivos totales | ~280 |
| API routes | ~67 |
| Componentes React | ~80+ |
| Migraciones Supabase | 6 |
| Tests | 0 |
| Dependencias prod | 27 |
| Next.js | 16.0.1 |
| React | 19.2.0 |

---

## Enlaces

- [Índice de documentación](../INDEX.md)
- [Setup](../setup/README_ENV.md)
- [Deployment](../deployment/DEPLOYMENT_GUIDE.md)

---

**Última actualización:** Julio 2026  
**Método:** Revisión manual del código fuente + auditoría automatizada  
**Progreso global:** ████████████████░░░░░░░░░░░░░░░░░░░░ **65%**

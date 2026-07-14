# Documentación Calixo PWA

```
Progreso global:  ████████████████░░░░░░░░░░░░░░░░░░░░  65%
```

---

## Inicio rápido

| Necesitas… | Documento |
|------------|-----------|
| Instalar el proyecto | [README.md](../README.md) |
| Variables de entorno | [setup/README_ENV.md](./setup/README_ENV.md) |
| Modo PRE vs PRO | [setup/ENVIRONMENT_MODES_GUIDE.md](./setup/ENVIRONMENT_MODES_GUIDE.md) |
| Estado del proyecto | [progress/PROJECT_STATUS.md](./progress/PROJECT_STATUS.md) |
| Desplegar a producción | [deployment/DEPLOYMENT_GUIDE.md](./deployment/DEPLOYMENT_GUIDE.md) |

---

## Estructura

```
docs/
├── INDEX.md                  # Este archivo
├── README.md                 # Guía de navegación
├── progress/
│   └── PROJECT_STATUS.md     # Dashboard con barras de progreso
├── setup/                    # Configuración e instalación
├── deployment/               # CI/CD y Vercel
├── DATABASE_SCHEMA.md        # Esquema completo de Supabase
├── AUTH_IMPLEMENTATION.md    # Autenticación
└── app_flow_document.md      # Flujos de usuario
```

---

## Progreso del proyecto

→ **[PROJECT_STATUS.md](./progress/PROJECT_STATUS.md)** — dashboard completo con barras por módulo, brechas críticas y roadmap.

---

## Setup

| Guía | Descripción |
|------|-------------|
| [README_ENV.md](./setup/README_ENV.md) | Variables de entorno (inicio rápido) |
| [ENVIRONMENT_MODES_GUIDE.md](./setup/ENVIRONMENT_MODES_GUIDE.md) | Modo PRE vs PRO |
| [STORE_SETUP.md](./setup/STORE_SETUP.md) | Tienda de cupones |
| [PROFILE_PHOTO_SETUP.md](./setup/PROFILE_PHOTO_SETUP.md) | Fotos de perfil (Storage) |
| [CHALLENGE_IMAGES_SETUP.md](./setup/CHALLENGE_IMAGES_SETUP.md) | Imágenes de retos |
| [PWA_ICONS_GUIDE.md](./setup/PWA_ICONS_GUIDE.md) | Iconos PWA |
| [ENERGY_DECAY_SETUP.md](./setup/ENERGY_DECAY_SETUP.md) | Decaimiento de energía |

Scripts SQL en `setup/` (ejecutar en Supabase SQL Editor):

- `COUPONS_SETUP.sql` — tablas de cupones
- `CREATE_FEED_LIKES_TABLE.sql` — likes del feed
- `UPDATE_TRANSACTIONS_COUPON.sql` — transacciones de cupones
- `ENERGY_DECAY_CRON.sql` — cron de energía

Migraciones versionadas: `supabase/migrations/`

Esquema completo documentado: **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)**

---

## Deployment

| Guía | Descripción |
|------|-------------|
| [DEPLOYMENT_GUIDE.md](./deployment/DEPLOYMENT_GUIDE.md) | Guía completa de deployment |
| [VERCEL_SETUP.md](./deployment/VERCEL_SETUP.md) | Setup rápido en Vercel |

---

## Referencia técnica

| Documento | Descripción |
|-----------|-------------|
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Esquema completo de BD: tablas, enums, RLS, triggers |
| [AUTH_IMPLEMENTATION.md](./AUTH_IMPLEMENTATION.md) | Auth con Supabase, middleware, flujos |
| [app_flow_document.md](./app_flow_document.md) | Flujos de usuario y journeys |
| [MESSAGING.md](./MESSAGING.md) | Mensajes privados (DMs), estados enviado/entregado/visto |
| [GROUPS.md](./GROUPS.md) | Grupos estilo WhatsApp, chat, invitaciones |
| [GROUP_CHALLENGES.md](./GROUP_CHALLENGES.md) | Retos grupales, apuestas, Visibility API |

---

**Última actualización:** Julio 2026 · **Progreso:** 65%

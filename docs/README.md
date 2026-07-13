# Documentación Calixo PWA

Toda la documentación del proyecto vive en esta carpeta. El punto de entrada es **[INDEX.md](./INDEX.md)**.

```
Progreso global:  ████████████████░░░░░░░░░░░░░░░░░░░░  65%
```

---

## Estructura

```
docs/
├── INDEX.md                      # Índice maestro
├── README.md                     # Este archivo
│
├── progress/
│   └── PROJECT_STATUS.md         # Estado real con barras de progreso
│
├── setup/                        # Configuración
│   ├── README_ENV.md             # Variables de entorno (inicio rápido)
│   ├── ENVIRONMENT_MODES_GUIDE.md
│   ├── STORE_SETUP.md
│   ├── PROFILE_PHOTO_SETUP.md
│   ├── CHALLENGE_IMAGES_SETUP.md
│   ├── PWA_ICONS_GUIDE.md
│   ├── ENERGY_DECAY_SETUP.md
│   └── *.sql                     # Scripts SQL para Supabase
│
├── deployment/
│   ├── DEPLOYMENT_GUIDE.md
│   └── VERCEL_SETUP.md
│
├── AUTH_IMPLEMENTATION.md        # Autenticación
└── app_flow_document.md          # Flujos de usuario
```

---

## Por rol

**Primera vez:** [README del proyecto](../README.md) → [Variables de entorno](./setup/README_ENV.md)

**Desarrollo:** [Estado del proyecto](./progress/PROJECT_STATUS.md) · [Auth](./AUTH_IMPLEMENTATION.md) · [Flujos](./app_flow_document.md)

**Deploy:** [Deployment Guide](./deployment/DEPLOYMENT_GUIDE.md) · [Vercel Setup](./deployment/VERCEL_SETUP.md)

**Supabase:** Migraciones en `supabase/migrations/` + scripts SQL en `setup/`

---

**Última actualización:** Julio 2026

# Calixo API (backend-app)

Backend Node/Express + TypeScript que expone como API REST toda la lógica que
antes vivía en `app/api/*` (Next.js Route Handlers), para que la app de
Android (Android Studio) pueda consumir el mismo backend y la misma base de
datos Supabase que ya usa la PWA.

📄 **Documentación completa para el equipo de Android:** [`docs/API_REFERENCE.md`](./docs/API_REFERENCE.md)

## Quick start

```bash
cd server
cp .env.example .env    # rellena con las credenciales del proyecto Supabase (las mismas que .env.local de la PWA)
npm install
npm run dev              # http://localhost:3001
```

Scripts disponibles:
- `npm run dev` — desarrollo con recarga automática (tsx watch)
- `npm run build` — compila a `dist/` con tsc
- `npm start` — ejecuta la build compilada
- `npm run type-check` — verifica tipos sin compilar

## Estructura

```
server/
├── src/
│   ├── app.ts              # configuración de Express (middlewares, montaje de routers)
│   ├── index.ts            # punto de entrada (arranca el servidor)
│   ├── routes/*.routes.ts  # un router por dominio (admin, feed, groups, ...)
│   ├── middleware/          # auth, admin, subida de archivos, errores
│   ├── lib/                 # lógica compartida portada desde la PWA (Supabase, Stripe, validaciones, etc.)
│   └── types/               # tipos de Express (req.user, req.supabase)
├── docs/API_REFERENCE.md    # referencia completa de los 106 endpoints
├── .env.example
└── package.json
```

## Notas importantes

- Usa el **mismo proyecto Supabase** que la PWA — no hay que migrar datos ni
  duplicar tablas.
- La autenticación es vía **Bearer JWT de Supabase Auth** (no cookies), para
  que encaje de forma nativa con el SDK de Supabase para Android/Kotlin.
- Las políticas RLS de Supabase siguen aplicándose exactamente igual que en
  la PWA.

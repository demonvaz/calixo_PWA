# Calixo PWA - Digital Detox Gamification App 🌟

> Una aplicación progresiva que gamifica la desconexión digital para mejorar el bienestar mental

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-green)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-purple)](https://stripe.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Estado del Proyecto:** 🟡 **MVP avanzado (~65%)** — Ver [estado detallado](docs/progress/PROJECT_STATUS.md)

```
Progreso global:  ████████████████░░░░░░░░░░░░░░░░░░░░  65%
```

---

## 🎯 ¿Qué es Calixo?

Calixo es una PWA (Progressive Web App) que ayuda a los usuarios a reducir su uso de pantallas mediante:
- 🎮 **Gamificación**: Sistema de retos y recompensas
- 🎨 **Avatar Virtual (CALI)**: Mascota que refleja tu energía mental
- 🏪 **Tienda Virtual**: Personaliza tu avatar con monedas ganadas
- 👥 **Social**: Compite y colabora con amigos
- ⭐ **Premium**: Funcionalidades avanzadas con subscripción

---

## ✨ Funcionalidades Principales

### ✅ Implementado (funcional)
- 🔐 **Autenticación** con Supabase (email, Google OAuth) — `████████░░` 78%
- 🎯 **Retos diarios y enfoque** con timer y recompensas — `████████░░` 85%
- 🎨 **Editor de avatar CALI** (6 categorías) — `██████░░░░` 62%
- 🏪 **Tienda de cupones** con monedas — `████████░░` 88%
- 📱 **Feed social** (posts, likes, comentarios, followers) — `████████░░` 78%
- 💳 **Suscripciones Stripe** (mensual y anual) — `████████░░` 84%
- 🔔 **Notificaciones in-app** — `█████░░░░░` 52%
- 👤 **Perfil de usuario** completo — `████████░░` 84%
- 🛡️ **Panel de administración** — `████████░░` 86%

### ⚠️ Parcial o pendiente
- 👥 Retos sociales (invitaciones rotas) — `████░░░░░░` 45%
- 📲 PWA instalable (iconos faltantes) — `██████░░░░` 58%
- ♿ Accesibilidad WCAG — `███░░░░░░░` 32%
- 🌍 i18n (solo español hardcodeado) — `░░░░░░░░░░` 5%
- 🧪 Tests automatizados — `░░░░░░░░░░` 0%

---

## 🚀 Quick Start

### Prerrequisitos
```bash
Node.js >= 18.0.0
npm >= 9.0.0
PostgreSQL (via Supabase)
```

### Instalación

1. **Clona el repositorio**
```bash
git clone https://github.com/tu-usuario/calixo.git
cd calixo
```

2. **Instala dependencias**
```bash
npm install
```

3. **Configura variables de entorno**
```bash
cp .env.example .env.local
# Edita .env.local con tus valores
```

📖 **Guía detallada:** [docs/setup/README_ENV.md](docs/setup/README_ENV.md)

4. **Ejecuta migraciones**
```bash
npm run db:push
npm run db:seed
```

5. **Inicia el servidor**
```bash
npm run dev
```

6. **Abre en tu navegador**
```
http://localhost:3000
```

---

## 📚 Documentación

### 🔥 Inicio Rápido
- **[Variables de entorno](docs/setup/README_ENV.md)** - Configuración de entorno
- **[PRE vs PRO Mode](docs/setup/ENVIRONMENT_MODES_GUIDE.md)** - Modos de desarrollo
- **[Estado del proyecto](docs/progress/PROJECT_STATUS.md)** - Dashboard con barras de progreso

### 📖 Documentación
- **[Documentation Index](docs/INDEX.md)** - Índice completo
- **[Auth Implementation](docs/AUTH_IMPLEMENTATION.md)** - Sistema de autenticación
- **[App Flow](docs/app_flow_document.md)** - Flujos de usuario

---

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 16** - Framework React con App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Component library

### Backend
- **Next.js API Routes** - REST API
- **Supabase** - Auth, Database (PostgreSQL), Storage
- **Supabase Client** - Queries type-safe vía Supabase JS
- **Stripe** - Payment processing

### DevOps
- **Vercel** - Hosting y deployment
- **GitHub Actions** - CI/CD (lint, type-check, build, deploy)

---

## 📁 Estructura del Proyecto

```
calixo/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── challenges/        # Challenge pages
│   ├── avatar/            # Avatar editor
│   ├── store/             # Store & transactions
│   ├── feed/              # Social feed
│   └── ...
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── avatar/           # Avatar-specific
│   ├── challenges/       # Challenge-specific
│   └── ...
├── db/                   # Database
│   ├── schema.ts         # Drizzle schema
│   ├── rls-policies.sql  # Row Level Security
│   └── seed.ts           # Database seeding
├── docs/                 # Documentación
│   ├── progress/        # Estado del proyecto
│   ├── setup/           # Guías de configuración
│   └── deployment/      # Deployment
├── lib/                 # Utilities
│   ├── supabase/       # Supabase clients
│   ├── stripe/         # Stripe config
│   └── ...
└── public/             # Static assets
```

---

## 🎮 Características Detalladas

### Sistema de Retos

#### 📅 Retos Diarios
- 3 retos gratuitos por día
- Ilimitados con Premium
- Categorías: Desayuno, ejercicio, lectura, etc.
- Recompensas: 50-100 monedas

#### 🎯 Modo Enfoque
- Timer personalizable (15min - 2h)
- Tracking con visibilitychange API
- Sistema de "honor"
- Recompensa por minuto

#### 👥 Retos Sociales
- Invita amigos
- Desconexión grupal
- Recompensas compartidas

### Avatar CALI

- **6 Categorías**: Color, Camiseta, Sombrero, Gafas, Fondo, Accesorios
- **3 Niveles de Energía**: Alta (😊), Media (😐), Baja (😴)
- **Personalización**: +300 items únicos
- **Unlocking**: Items gratuitos y premium

### Sistema de Monedas

- Gana monedas completando retos
- Compra items en la tienda
- Historial de transacciones
- Filtros y búsqueda avanzada

### Feed Social

- Comparte tus logros con foto y nota
- Da likes y comenta
- Sigue a otros usuarios
- Feed personalizado (siguiendo) o global

### Suscripciones Premium

#### Plan Mensual: $4.99/mes
- Retos diarios ilimitados
- Items exclusivos
- Estadísticas avanzadas
- Sin anuncios (futuro)

#### Plan Anual: $49.99/año
- Todo lo del mensual
- Ahorra 17%
- 2 meses gratis

---

## 🔧 Development

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build           # Build de producción
npm run start           # Servidor de producción

# Base de datos
npm run db:generate     # Generar migraciones
npm run db:push         # Aplicar cambios al schema
npm run db:studio       # Abrir Drizzle Studio
npm run db:seed         # Seed inicial

# Linting
npm run lint            # Ejecutar ESLint
npm run lint:fix        # Fix automático

# Testing (próximamente)
npm run test            # Ejecutar tests
npm run test:watch      # Tests en modo watch
```

### Environment Modes

#### PRE Mode (Development)
```bash
APP_ENV=PRE  # Pagos simulados, desarrollo rápido
```

#### PRO Mode (Production)
```bash
APP_ENV=PRO  # Stripe real, producción
```

📖 **Más info:** [Environment Modes Guide](docs/setup/ENVIRONMENT_MODES_GUIDE.md)

---

## 📊 Estadísticas del Proyecto

```
Progreso global:        ████████████████░░░░░░░░░░░░░░░░░░░░  65%
Archivos:               ~280 archivos
API Endpoints:          ~67 endpoints
Componentes React:      ~80+ componentes
Migraciones Supabase:   6 (parciales)
Tests:                  0
Documentación:          44+ documentos
```

Ver dashboard completo: [docs/progress/PROJECT_STATUS.md](docs/progress/PROJECT_STATUS.md)

---

## 🗺️ Roadmap

### ✅ Fase 1-9 (Completado)
- [x] Setup del proyecto
- [x] Autenticación
- [x] Base de datos
- [x] Sistema de retos
- [x] Avatar CALI
- [x] Tienda y monedas
- [x] Feed social
- [x] Suscripciones
- [x] Notificaciones

### 🟡 Fases con gaps conocidos
- [~] **Fase 3:** BD — tablas sin migración (`52%`)
- [~] **Fase 4:** Retos sociales rotos (`74%`)
- [~] **Fase 5:** Avatar — compra inconsistente (`62%`)
- [~] **Fase 11:** PWA — iconos faltantes (`58%`)
- [~] **Fase 12:** a11y básico, i18n inexistente (`19%`)

### 🔴 Bloqueantes para producción
- [ ] Consolidar migraciones Supabase (todas las tablas + RLS)
- [ ] Arreglar retos sociales y compra avatar
- [ ] Generar iconos PWA
- [ ] Tests automatizados
- [ ] Completar reset password

### 🚀 Mejoras futuras (v1.1+)
- [ ] i18n real (next-intl)
- [ ] Error monitoring (Sentry)
- [ ] Modo oscuro
- [ ] Push notifications end-to-end

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una branch para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Convenciones de Código

- TypeScript estricto
- ESLint + Prettier
- Conventional Commits
- Tests requeridos (próximamente)

---

## 📝 License

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## 👥 Equipo

- **Lead Developer** - [Tu Nombre](https://github.com/tu-usuario)
- **Contributors** - Ver [CONTRIBUTORS.md](CONTRIBUTORS.md)

---

## 📧 Contacto

- **Email:** soporte@calixo.app
- **Website:** https://calixo.app (próximamente)
- **GitHub:** https://github.com/tu-usuario/calixo

---

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) - Framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Stripe](https://stripe.com/) - Payment processing
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Vercel](https://vercel.com/) - Hosting

---

## 📚 Recursos Adicionales

- [Documentation Index](docs/INDEX.md) - Documentación completa
- [Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md) - Guía de deployment
- [Contributing Guidelines](CONTRIBUTING.md) - Guía de contribución

---

<div align="center">

**Hecho con ❤️ para mejorar el bienestar digital**

[Documentación](docs/INDEX.md) • [Reportar Bug](https://github.com/tu-usuario/calixo/issues) • [Solicitar Feature](https://github.com/tu-usuario/calixo/issues)

</div>

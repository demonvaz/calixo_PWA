# 🌟 Calixo - PWA de Desconexión Digital

Calixo es una Progressive Web App (PWA) social diseñada para fomentar la desconexión digital a través de retos gamificados. Los usuarios pueden aceptar desafíos diarios, personalizar su avatar CALI, y compartir su progreso en una comunidad que valora el bienestar digital.

## 📋 Descripción del Proyecto

Calixo permite a los usuarios:
- ✅ Completar retos diarios, de enfoque y sociales
- 🎨 Personalizar un avatar amigable llamado CALI
- 💰 Ganar monedas in-app para desbloquear cosméticos
- 👥 Compartir progreso en un feed social
- 🔔 Recibir notificaciones in-app y push
- 💳 Suscribirse a planes premium con Stripe
- 🛡️ Sistema de moderación y administración

## 🚀 Estado del Proyecto

**Fase Actual:** Fase 1 - Configuración Inicial ✅

### Fases Completadas
- [x] Fase 1: Configuración del proyecto y entorno
  - [x] Inicialización de Next.js con TypeScript
  - [x] Configuración de Tailwind CSS y shadcn/ui
  - [x] Configuración de Drizzle ORM
  - [x] Docker y docker-compose
  - [x] Configuración PWA básica

### Fases Pendientes
- [ ] Fase 2: Autenticación con Supabase
- [ ] Fase 3: Base de datos y migraciones
- [ ] Fase 4: Sistema de retos
- [ ] Fase 5: Avatar CALI
- [ ] Fase 6: Moneda in-app y tienda
- [ ] Fase 7: Feed social y perfiles
- [ ] Fase 8: Suscripciones con Stripe
- [ ] Fase 9: Notificaciones
- [ ] Fase 10: Panel de administración
- [ ] Fase 11: PWA completo
- [ ] Fase 12: Accesibilidad e i18n
- [ ] Fase 13: CI/CD y despliegue

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 16**: Framework React con App Router
- **React 19**: Librería de UI
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Framework de utilidades CSS
- **shadcn/ui**: Componentes accesibles

### Backend
- **Supabase**: Auth, Database (PostgreSQL), Storage
- **Drizzle ORM**: ORM tipado para PostgreSQL
- **Stripe**: Procesamiento de pagos
- **OpenAI**: Moderación de contenido (opcional)

### DevOps
- **Docker**: Contenerización
- **GitHub Actions**: CI/CD (próximamente)
- **Vercel**: Hosting y deployment

## 📦 Instalación

### Prerrequisitos
- Node.js 20+ 
- npm o pnpm
- Docker y Docker Compose (opcional, para desarrollo local)

### Configuración Local

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/calixo.git
cd calixo
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env.local` basado en `env.example.txt`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/calixo_dev

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Iniciar base de datos con Docker** (opcional)
```bash
docker-compose up postgres -d
```

5. **Ejecutar migraciones** (cuando estén disponibles)
```bash
npm run db:push
```

6. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🏗️ Estructura del Proyecto

```
calixo/
├── app/                    # App Router de Next.js
│   ├── api/               # API routes
│   ├── (auth)/            # Rutas de autenticación
│   ├── (main)/            # Rutas principales
│   ├── layout.tsx         # Layout raíz
│   ├── page.tsx           # Página principal
│   └── globals.css        # Estilos globales
├── components/            # Componentes React
│   ├── ui/               # Componentes de shadcn/ui
│   ├── auth/             # Componentes de autenticación
│   ├── challenges/       # Componentes de retos
│   ├── avatar/           # Componentes del avatar
│   └── layout/           # Componentes de layout
├── db/                   # Base de datos
│   ├── schema.ts         # Esquema de Drizzle
│   └── index.ts          # Cliente de base de datos
├── lib/                  # Utilidades y helpers
│   ├── supabase.ts       # Cliente de Supabase
│   └── utils.ts          # Funciones de utilidad
├── types/                # Definiciones de tipos TypeScript
│   └── index.ts          # Tipos principales
├── public/               # Archivos estáticos
│   ├── icons/           # Iconos PWA
│   └── manifest.json    # Manifest PWA
├── docs/                 # Documentación del proyecto
├── drizzle/             # Migraciones de base de datos
└── docker-compose.yml   # Configuración de Docker
```

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo
npm run build           # Construye para producción
npm run start           # Inicia servidor de producción
npm run lint            # Ejecuta linter
npm run type-check      # Verifica tipos TypeScript

# Base de datos (próximamente)
npm run db:push         # Aplica cambios al esquema
npm run db:studio       # Abre Drizzle Studio
npm run db:generate     # Genera migraciones
```

## 🎨 Paleta de Colores

- **Beige Background**: `#F5F0E8` - Color de fondo principal
- **Soft Blue**: `#5A8DEE` - Color primario
- **Neutral Gray**: `#6B7280` - Texto y bordes
- **Accent Green**: `#22C55E` - Éxito
- **Accent Red**: `#EF4444` - Error
- **Dark Navy**: `#1E293B` - Encabezados

## 🔐 Seguridad

- Autenticación con Supabase Auth (JWT)
- Row-Level Security (RLS) en PostgreSQL
- Validación de entrada con Zod
- URLs firmadas para imágenes
- Verificación de webhooks de Stripe
- HTTPS en producción
- Content Security Policy (CSP)

## ♿ Accesibilidad

Calixo cumple con WCAG 2.1 AA:
- Ratios de contraste ≥ 4.5:1
- Navegación completa por teclado
- Etiquetas ARIA apropiadas
- Soporte para lectores de pantalla
- Respeto a `prefers-reduced-motion`

## 📱 PWA Features

- ✅ Instalable en dispositivos móviles y desktop
- ✅ Funcionamiento offline con Service Worker
- ✅ Caché de assets estáticos
- ✅ Notificaciones push web
- ✅ Sincronización en background

## 📄 Documentación

La documentación completa del proyecto se encuentra en la carpeta `/docs`:

- [Requisitos del Proyecto](./docs/project_requirements_document.md)
- [Stack Tecnológico](./docs/tech_stack_document.md)
- [Estructura del Backend](./docs/backend_structure_document.md)
- [Guía del Frontend](./docs/frontend_guidelines_document.md)
- [Plan de Implementación](./docs/security_guideline_document.md)
- [Flujo de la Aplicación](./docs/app_flow_document.md)

## 🤝 Contribución

Este proyecto está en desarrollo activo. Para contribuir:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la licencia ISC.

## 👥 Equipo

Desarrollado con ❤️ por el equipo de Calixo.

## 🔗 Enlaces

- [Documentación](./docs/)
- [Issues](https://github.com/tu-usuario/calixo/issues)
- [Supabase](https://supabase.com/)
- [Next.js](https://nextjs.org/)

---

**Nota**: Este proyecto está en desarrollo activo. Las características y la documentación pueden cambiar.


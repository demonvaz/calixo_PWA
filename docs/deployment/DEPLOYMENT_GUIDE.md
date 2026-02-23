# 🚀 Guía de Deployment - Calixo PWA

Esta guía explica cómo desplegar Calixo PWA en producción usando Vercel.

---

## 📋 Prerrequisitos

Antes de desplegar, asegúrate de tener:

- ✅ Cuenta de GitHub con el repositorio del proyecto
- ✅ Cuenta de Vercel (gratuita)
- ✅ Cuenta de Supabase configurada
- ✅ Cuenta de Stripe configurada
- ✅ Todas las variables de entorno listas

---

## 🔧 Paso 1: Configurar Variables de Entorno en Vercel

1. **Ve a tu proyecto en Vercel Dashboard**
2. **Settings → Environment Variables**
3. **Agrega las siguientes variables:**

### Variables Requeridas

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
DATABASE_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# App
APP_ENV=PRO
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

### Variables por Entorno

- **Production**: Todas las variables con valores de producción
- **Preview**: Puedes usar valores de desarrollo para testing
- **Development**: Valores locales (no se usa en Vercel)

---

## 🔗 Paso 2: Conectar Repositorio GitHub

1. **En Vercel Dashboard, click "Add New Project"**
2. **Importa tu repositorio de GitHub**
3. **Configura el proyecto:**
   - Framework Preset: **Next.js**
   - Root Directory: `.` (raíz)
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm ci`

---

## ⚙️ Paso 3: Configurar Base de Datos

### Aplicar Migraciones

Antes del primer deploy, aplica las migraciones de la base de datos:

```bash
# Localmente o en un script
npm run db:push
```

O ejecuta manualmente en Supabase SQL Editor:

```sql
-- Ejecutar db/rls-policies.sql
-- Asegúrate de que todas las políticas RLS estén activas
```

### Verificar RLS Policies

En Supabase Dashboard → Authentication → Policies, verifica que todas las tablas tengan RLS habilitado.

---

## 🔐 Paso 4: Configurar Stripe Webhooks

1. **Ve a Stripe Dashboard → Developers → Webhooks**
2. **Add endpoint:**
   - URL: `https://tu-dominio.vercel.app/api/stripe/webhook`
   - Events to send:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
3. **Copia el Webhook Secret** y agrégalo a Vercel como `STRIPE_WEBHOOK_SECRET`

---

## 📦 Paso 5: Deploy

### Deploy Automático (Recomendado)

1. **Push a la rama `main`:**
   ```bash
   git push origin main
   ```
2. **Vercel detectará el push y desplegará automáticamente**
3. **Revisa el log de build en Vercel Dashboard**

### Deploy Manual

1. **En Vercel Dashboard → Deployments**
2. **Click "Redeploy"** en el último deployment
3. **O usa Vercel CLI:**
   ```bash
   npm i -g vercel
   vercel --prod
   ```

---

## ✅ Paso 6: Verificación Post-Deploy

### Checklist de Verificación

- [ ] **Homepage carga correctamente**
- [ ] **Autenticación funciona** (login/signup)
- [ ] **Dashboard carga datos del usuario**
- [ ] **Retos se pueden iniciar y completar**
- [ ] **Tienda funciona** (compras con monedas)
- [ ] **Feed social carga posts**
- [ ] **Suscripciones Stripe funcionan**
- [ ] **PWA se puede instalar**
- [ ] **Service Worker está activo** (verificar en DevTools)
- [ ] **Offline mode funciona**

### Verificar Service Worker

1. Abre Chrome DevTools (F12)
2. Application → Service Workers
3. Debe mostrar: "activated and is running"
4. Probar modo offline (Network → Offline)

### Verificar PWA

1. Lighthouse audit (DevTools → Lighthouse)
2. PWA score debe ser > 90
3. Verificar que se puede instalar

---

## 🔄 Paso 7: Configurar Dominio Personalizado (Opcional)

1. **Vercel Dashboard → Settings → Domains**
2. **Add Domain**
3. **Sigue las instrucciones para configurar DNS:**
   - A Record: `@` → `76.76.21.21`
   - CNAME: `www` → `cname.vercel-dns.com`
4. **Espera propagación DNS (puede tardar hasta 24h)**

---

## 🐛 Troubleshooting

### Build Fails

**Error: Missing environment variables**
- Verifica que todas las variables estén en Vercel
- Revisa que los nombres sean exactos (case-sensitive)

**Error: Database connection**
- Verifica `DATABASE_URL` es correcta
- Asegúrate de que Supabase permite conexiones desde Vercel IPs

**Error: TypeScript errors**
- Ejecuta `npm run type-check` localmente
- Corrige errores antes de hacer push

### Runtime Errors

**Error: Stripe webhook fails**
- Verifica `STRIPE_WEBHOOK_SECRET` es correcto
- Revisa logs en Stripe Dashboard → Webhooks

**Error: Supabase RLS blocks requests**
- Verifica políticas RLS en Supabase
- Asegúrate de que `NEXT_PUBLIC_SUPABASE_ANON_KEY` es correcta

**Error: Service Worker not registering**
- Verifica que `/sw.js` existe en `public/`
- Revisa console para errores de registro

---

## 📊 Monitoreo

### Vercel Analytics

1. **Vercel Dashboard → Analytics**
2. **Habilita Vercel Analytics** (gratis hasta cierto límite)
3. **Monitorea:**
   - Page views
   - Performance metrics
   - Error rates

### Logs

1. **Vercel Dashboard → Deployments → [deployment] → Logs**
2. **Revisa logs en tiempo real**
3. **Filtra por errores o warnings**

---

## 🔒 Seguridad

### Headers de Seguridad

Ya configurados en `vercel.json`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Variables de Entorno

- ✅ **NUNCA** commits secrets al repositorio
- ✅ Usa Vercel Environment Variables
- ✅ Diferentes valores para Production vs Preview
- ✅ Rota keys periódicamente

---

## 🚀 CI/CD Automático

El proyecto incluye GitHub Actions workflows:

### `.github/workflows/ci.yml`
- Ejecuta en cada PR
- Lint + Type check + Build
- Bloquea merge si falla

### `.github/workflows/deploy.yml`
- Ejecuta en push a `main`
- Deploy automático a Vercel Production

**Configurar Secrets en GitHub:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

## 📝 Checklist Pre-Deploy

Antes de cada deploy a producción:

- [ ] Todas las migraciones aplicadas
- [ ] Variables de entorno configuradas
- [ ] Stripe webhooks configurados
- [ ] Tests pasando (si existen)
- [ ] Lint sin errores
- [ ] Type check sin errores
- [ ] Build exitoso localmente
- [ ] Service Worker funcionando
- [ ] PWA instalable

---

## 🔄 Rollback

Si algo sale mal:

1. **Vercel Dashboard → Deployments**
2. **Encuentra el deployment anterior que funcionaba**
3. **Click "..." → "Promote to Production"**
4. **El rollback es instantáneo**

---

## 📚 Recursos Adicionales

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

---

**Última Actualización:** Noviembre 2025  
**Versión:** 1.0.0



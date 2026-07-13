# 🔧 Configuración de Variables de Entorno

## Quick Start

```bash
# 1. Copia el archivo de ejemplo
cp .env.example .env.local

# 2. Completa los valores necesarios

# 3. Inicia el servidor
npm run dev
```

---

## 🎯 Modo PRE vs PRO

### APP_ENV=PRE (Desarrollo)
```bash
APP_ENV=PRE
```
✅ **Ideal para desarrollo local**
- Los pagos se procesan **automáticamente**
- No necesitas configurar Stripe
- Premium se activa instantáneamente
- Perfecto para testing

### APP_ENV=PRO (Producción)
```bash
APP_ENV=PRO
```
✅ **Para producción**
- Los pagos funcionan con Stripe **normalmente**
- Requiere configuración completa
- Webhooks y pagos reales

---

## 📝 Variables Mínimas para Desarrollo

Para desarrollo local con **APP_ENV=PRE**, solo necesitas:

```bash
# Environment
APP_ENV=PRE

# Supabase (obligatorio)
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service

# Database (obligatorio)
DATABASE_URL=tu_connection_string_postgresql

# App URL (obligatorio)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe (NO necesario en PRE mode)
# Puedes dejar estos vacíos o con valores placeholder
```

---

## 📋 Variables Completas para Producción

Para producción con **APP_ENV=PRO**, necesitas todas:

```bash
# Environment
APP_ENV=PRO

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Database
DATABASE_URL=...

# Stripe (OBLIGATORIO en PRO)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_...

# App URL
NEXT_PUBLIC_APP_URL=https://tudominio.com
```

---

## 🧪 Cómo Probar

### Testing en PRE Mode
1. Configura `APP_ENV=PRE`
2. Ve a `/pricing`
3. Click en "Suscribirme ahora"
4. ✅ Premium se activa instantáneamente
5. Verás en consola: `🔧 PRE MODE: Activando premium sin Stripe`

### Testing en PRO Mode
1. Configura `APP_ENV=PRO`
2. Configura todas las variables de Stripe
3. Ve a `/pricing`
4. Click en "Suscribirme ahora"
5. 💳 Te redirige a Stripe Checkout
6. Usa tarjeta de prueba: `4242 4242 4242 4242`
7. Verás en consola: `💳 PRO MODE: Creando sesión de Stripe`

---

## 📚 Documentación Completa

Ver [ENVIRONMENT_MODES_GUIDE.md](./ENVIRONMENT_MODES_GUIDE.md) para detalle de PRE vs PRO y [DEPLOYMENT_GUIDE.md](../deployment/DEPLOYMENT_GUIDE.md) para webhooks y producción.

---

## ⚠️ Importante

- ❌ **NUNCA** subas `.env.local` a Git
- ✅ **SÍ** sube `.env.example` a Git
- 🔒 Usa claves de TEST en desarrollo
- 🚀 Usa claves LIVE en producción
- 🔄 Reinicia el servidor después de cambiar variables

---

## 🆘 Problemas Comunes

### "Missing NEXT_PUBLIC_SUPABASE_URL"
→ Verifica que el archivo se llame `.env.local`

### Premium no se activa en PRE mode
→ Verifica `APP_ENV=PRE` y reinicia el servidor

### Stripe no funciona en PRO mode
→ Verifica que todas las claves de Stripe estén configuradas

---

**¿Más ayuda?** → [ENVIRONMENT_MODES_GUIDE.md](./ENVIRONMENT_MODES_GUIDE.md) · [DEPLOYMENT_GUIDE.md](../deployment/DEPLOYMENT_GUIDE.md)


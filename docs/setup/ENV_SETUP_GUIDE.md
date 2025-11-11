# Guía de Configuración de Variables de Entorno

Esta guía te ayudará a configurar correctamente todas las variables de entorno necesarias para ejecutar Calixo PWA.

---

## 🚀 Inicio Rápido

1. **Copia el archivo de ejemplo:**
   ```bash
   cp .env.example .env.local
   ```

2. **Completa los valores** según esta guía

3. **Reinicia el servidor** de Next.js
   ```bash
   npm run dev
   ```

---

## 🔧 Modo PRE vs PRO

### APP_ENV=PRE (Pre-producción)
- ✅ **Recomendado para desarrollo local**
- Los pagos se procesan **automáticamente sin Stripe**
- No necesitas configurar Stripe para probar premium
- El usuario obtiene premium instantáneamente al hacer click en "Suscribirme"
- Ideal para testing de funcionalidades premium

### APP_ENV=PRO (Producción)
- ✅ **Requerido para producción**
- Los pagos funcionan con Stripe **normalmente**
- Requiere configuración completa de Stripe
- Los usuarios pagan con tarjeta real (o de prueba en test mode)
- Webhooks de Stripe activan el premium

**Configuración recomendada:**
```bash
# Desarrollo local
APP_ENV=PRE

# Staging/Testing
APP_ENV=PRE

# Producción
APP_ENV=PRO
```

---

## 📋 Variables Requeridas

### 1. Supabase Configuration

#### ¿Dónde obtener?
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Click en **Settings** > **API**

#### Variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Notas:**
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` es **sensible**, NUNCA la compartas
- ℹ️ `NEXT_PUBLIC_*` son visibles en el cliente, son seguras

---

### 2. Database Configuration

#### ¿Dónde obtener?
1. Supabase Dashboard > **Settings** > **Database**
2. Sección **Connection string** > **URI**

#### Variable:
```bash
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

**Notas:**
- Asegúrate de incluir `?sslmode=require` al final si es necesario
- Usa el **Connection Pooler** URL para mejor performance

---

### 3. Stripe Configuration (Solo si APP_ENV=PRO)

#### ¿Dónde obtener?
1. Ve a [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Click en **Developers** > **API Keys**

#### Variables:

**Claves de API:**
```bash
# Para desarrollo: usa claves de TEST
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

**Webhook Secret:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Para obtener el Webhook Secret:**
1. Stripe Dashboard > **Developers** > **Webhooks**
2. Click en **Add endpoint**
3. URL: `https://tudominio.com/api/stripe/webhook`
4. Eventos a escuchar:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copia el **Signing secret** (whsec_...)

**Price IDs:**
```bash
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_xxxxxxxxxxxxx
```

**Para obtener los Price IDs:**
1. Stripe Dashboard > **Products**
2. Click en **Add product**
3. Crea dos productos:
   - **Premium Monthly**: $4.99/mes (recurring monthly)
   - **Premium Yearly**: $49.99/año (recurring yearly)
4. Copia los **Price IDs** (no Product IDs)

---

### 4. App Configuration

```bash
# Desarrollo local
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Producción
NEXT_PUBLIC_APP_URL=https://tudominio.com
```

**Nota:** Esta URL se usa para:
- Redirecciones de Stripe
- Webhooks
- Links en emails (futuro)

---

## 🧪 Testing con Stripe (APP_ENV=PRO)

### Tarjetas de Prueba

Cuando uses claves de TEST de Stripe (`pk_test_` y `sk_test_`), puedes usar estas tarjetas:

| Caso | Número | Resultado |
|------|--------|-----------|
| Éxito | `4242 4242 4242 4242` | Pago exitoso |
| Fallo | `4000 0000 0000 0002` | Tarjeta declinada |
| 3D Secure | `4000 0027 6000 3184` | Requiere autenticación |
| Insuficientes fondos | `4000 0000 0000 9995` | Fondos insuficientes |

**Datos adicionales:**
- **Fecha:** Cualquier fecha futura (ej: 12/25)
- **CVC:** Cualquier 3 dígitos (ej: 123)
- **ZIP:** Cualquier código postal válido

---

## 🔐 Seguridad

### ✅ Buenas Prácticas

1. **Nunca subas .env.local a Git**
   ```bash
   # Ya está en .gitignore, pero verifica:
   git status
   # .env.local NO debe aparecer
   ```

2. **Usa claves diferentes por ambiente**
   - Desarrollo: Claves de TEST de Stripe
   - Producción: Claves LIVE de Stripe

3. **Rota las claves periódicamente**
   - Especialmente si sospechas que fueron expuestas

4. **Usa variables de entorno en CI/CD**
   - Vercel, Netlify, etc. tienen sección de Environment Variables
   - No las incluyas en el código

---

## 🚨 Troubleshooting

### Error: "Missing NEXT_PUBLIC_SUPABASE_URL"
**Solución:** Verifica que el archivo se llame `.env.local` (no `.env`)

### Error: "Invalid Stripe key"
**Solución:** 
- Verifica que las claves empiecen con `pk_test_` o `sk_test_`
- Asegúrate de no tener espacios antes/después
- Reinicia el servidor después de cambiar

### Error: "Webhook signature verification failed"
**Solución:**
- Verifica que `STRIPE_WEBHOOK_SECRET` sea correcto
- En desarrollo local, usa Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Los pagos no funcionan en PRE mode
**Verificación:**
```bash
# En .env.local, debe estar:
APP_ENV=PRE

# Reinicia el servidor
npm run dev
```

### Premium no se activa en PRO mode
**Verificación:**
1. Verifica que el webhook esté configurado en Stripe
2. Verifica que el evento `checkout.session.completed` esté siendo escuchado
3. Revisa logs del servidor para ver si el webhook llegó

---

## 📚 Recursos Adicionales

- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

## ✅ Checklist de Configuración

Antes de desplegar a producción, verifica:

- [ ] Todas las variables están configuradas en `.env.local`
- [ ] `APP_ENV=PRO` para producción
- [ ] Claves de Stripe son LIVE (no TEST)
- [ ] Webhook configurado en Stripe Dashboard
- [ ] `NEXT_PUBLIC_APP_URL` apunta a dominio real
- [ ] Database URL apunta a base de datos de producción
- [ ] `.env.local` NO está en Git
- [ ] Variables configuradas en plataforma de deployment (Vercel/Netlify/etc)

---

**¿Necesitas ayuda?** Revisa la documentación del proyecto o contacta al equipo de desarrollo.


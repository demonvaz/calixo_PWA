# Guía de Modos de Entorno (PRE vs PRO)

## 🎯 Descripción General

Calixo PWA ahora soporta dos modos de operación para facilitar el desarrollo y testing sin necesidad de configurar Stripe:

- **PRE Mode (Pre-producción)**: Pagos simulados, premium instantáneo
- **PRO Mode (Producción)**: Pagos reales con Stripe

---

## 🔧 Configuración

### En tu archivo `.env.local`:

```bash
# Para desarrollo local (recomendado)
APP_ENV=PRE

# Para producción
APP_ENV=PRO
```

Si no se especifica, el sistema usa `PRO` por defecto.

---

## 🚀 PRE Mode (Pre-producción)

### Cuándo usar
- ✅ Desarrollo local
- ✅ Testing de funcionalidades premium
- ✅ Demos
- ✅ Staging

### Comportamiento

#### 1. Flujo de Subscripción Simplificado
```
Usuario → Click "Suscribirme" → Premium activado ✅
```

**Sin intermediarios:**
- No se llama a Stripe
- No se requiere tarjeta
- No se cobran webhooks

#### 2. Activación Instantánea
Al hacer click en "Suscribirme":
1. ✅ `isPremium` se activa en el perfil
2. ✅ Se crea registro en tabla `subscriptions`
3. ✅ Se redirige a `/subscription/success`
4. ✅ Usuario tiene acceso a features premium

#### 3. Datos Simulados
```typescript
{
  stripeSubscriptionId: 'pre_[userId]_[timestamp]',
  status: 'active',
  plan: 'premium',
  currentPeriodStart: now,
  currentPeriodEnd: now + 1 year,
  cancelAtPeriodEnd: false
}
```

#### 4. Logs en Consola
```bash
🔧 PRE MODE: Activando premium sin Stripe
✅ PRE MODE: Premium activado para usuario [userId]
```

### Ventajas
- ⚡ Testing instantáneo
- 🚫 No requiere configuración de Stripe
- 💰 No requiere tarjetas de prueba
- 🎯 Enfoque en funcionalidades, no en pagos

### Limitaciones
- ⚠️ No prueba flujo real de Stripe
- ⚠️ No valida webhooks
- ⚠️ No prueba errores de pago

---

## 💳 PRO Mode (Producción)

### Cuándo usar
- ✅ Producción
- ✅ Testing de integración con Stripe
- ✅ Validación de webhooks
- ✅ Testing de pagos reales

### Comportamiento

#### 1. Flujo Completo de Stripe
```
Usuario → Click "Suscribirme" → Stripe Checkout → Pago → Webhook → Premium ✅
```

**Proceso completo:**
1. Se crea sesión de Stripe Checkout
2. Usuario es redirigido a Stripe
3. Usuario completa pago
4. Stripe envía webhook `checkout.session.completed`
5. Servidor activa premium
6. Usuario redirigido a success

#### 2. Validaciones Completas
- ✅ Tarjeta válida
- ✅ Fondos suficientes
- ✅ 3D Secure (si aplica)
- ✅ Webhook signature
- ✅ Metadata de usuario

#### 3. Gestión de Lifecycle
```typescript
// Eventos manejados
checkout.session.completed     → Activar premium
customer.subscription.updated  → Actualizar estado
customer.subscription.deleted  → Desactivar premium
invoice.payment_succeeded      → Log de pago
invoice.payment_failed         → Log de error
```

#### 4. Logs en Consola
```bash
💳 PRO MODE: Creando sesión de Stripe
✅ Subscription activated for user [userId]
```

### Ventajas
- ✅ Flujo real de producción
- ✅ Validaciones completas
- ✅ Testing de webhooks
- ✅ Manejo de errores reales

### Requisitos
- ⚠️ Configuración completa de Stripe
- ⚠️ Webhooks configurados
- ⚠️ Tarjetas de prueba (en test mode)

---

## 📊 Comparación

| Característica | PRE Mode | PRO Mode |
|----------------|----------|----------|
| **Configuración Stripe** | ❌ No necesaria | ✅ Requerida |
| **Tarjetas de prueba** | ❌ No necesarias | ✅ Requeridas |
| **Webhooks** | ❌ No se usan | ✅ Requeridos |
| **Velocidad** | ⚡ Instantáneo | ⏱️ ~5 segundos |
| **Testing funcional** | ✅ Excelente | ✅ Completo |
| **Testing de pagos** | ❌ No prueba | ✅ Prueba real |
| **Producción** | ❌ No usar | ✅ Usar siempre |

---

## 🔀 Cambio de Modo

### De PRE a PRO

1. **Actualiza `.env.local`:**
   ```bash
   APP_ENV=PRO
   ```

2. **Configura Stripe:**
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_...
   NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_...
   ```

3. **Reinicia el servidor:**
   ```bash
   npm run dev
   ```

4. **Configura webhooks:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

### De PRO a PRE

1. **Actualiza `.env.local`:**
   ```bash
   APP_ENV=PRE
   ```

2. **Reinicia el servidor:**
   ```bash
   npm run dev
   ```

3. **¡Listo!** Las variables de Stripe pueden quedar configuradas pero no se usarán.

---

## 🧪 Testing

### Test en PRE Mode

```bash
# 1. Configura PRE mode
echo "APP_ENV=PRE" >> .env.local

# 2. Inicia servidor
npm run dev

# 3. Navega a /pricing
# 4. Click en "Suscribirme ahora"
# 5. ✅ Premium activado instantáneamente
```

**Verificación:**
```bash
# Verifica en consola del servidor:
🔧 PRE MODE: Activando premium sin Stripe
✅ PRE MODE: Premium activado para usuario [id]
```

### Test en PRO Mode

```bash
# 1. Configura PRO mode
echo "APP_ENV=PRO" >> .env.local

# 2. Configura todas las variables de Stripe

# 3. Inicia webhook listener (terminal separado)
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 4. Inicia servidor
npm run dev

# 5. Navega a /pricing
# 6. Click en "Suscribirme ahora"
# 7. 💳 Redirige a Stripe
# 8. Usa tarjeta: 4242 4242 4242 4242
# 9. ✅ Premium activado después de webhook
```

**Verificación:**
```bash
# Consola del servidor:
💳 PRO MODE: Creando sesión de Stripe
✅ Subscription activated for user [id]

# Consola de Stripe CLI:
[200] POST /api/stripe/webhook [evt_xxx]
```

---

## 📝 Implementación Técnica

### Código Modificado

**`app/api/stripe/checkout/route.ts`:**
```typescript
const appEnv = process.env.APP_ENV || 'PRO';

if (appEnv === 'PRE') {
  // Activar premium directamente
  await db.update(profiles).set({ isPremium: true });
  await db.insert(subscriptions).values({...});
  return { url: '/subscription/success', preMode: true };
}

// Proceso normal con Stripe
const session = await stripe.checkout.sessions.create({...});
return { url: session.url, preMode: false };
```

**`app/pricing/page.tsx`:**
```typescript
const { url, preMode } = await response.json();

if (preMode) {
  // Redirigir directamente
  window.location.href = url;
  return;
}

// Redirigir a Stripe
await stripe.redirectToCheckout({ sessionId });
```

---

## ⚠️ Consideraciones de Seguridad

### ✅ PRE Mode es Seguro para Desarrollo

**Razones:**
1. Requiere autenticación
2. Usuario solo puede activar su propio premium
3. Solo se puede activar una vez
4. Logs detallados de activación

**Pero NO para producción:**
- ❌ Bypass del sistema de pagos
- ❌ Premium gratis para todos
- ❌ Sin validación financiera

### 🔒 PRO Mode para Producción

**Siempre usa PRO en producción:**
```bash
# Production .env
APP_ENV=PRO
STRIPE_SECRET_KEY=sk_live_...  # Live keys, no test!
```

---

## 🎓 Mejores Prácticas

### 1. Desarrollo Local
```bash
APP_ENV=PRE
# Rápido, fácil, sin complicaciones
```

### 2. Staging/QA
```bash
APP_ENV=PRE
# O APP_ENV=PRO con claves de TEST
# Dependiendo de qué estés testeando
```

### 3. Producción
```bash
APP_ENV=PRO
# SIEMPRE PRO en producción
# Con claves LIVE de Stripe
```

### 4. Testing de Pagos
```bash
APP_ENV=PRO
# Usa claves de TEST
# Configura webhooks locales
```

---

## 📚 Referencias

- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md)

---

## ✅ Checklist

Antes de desplegar:

- [ ] `APP_ENV=PRO` en producción
- [ ] Claves LIVE de Stripe configuradas
- [ ] Webhooks configurados en Stripe Dashboard
- [ ] Testing completo en PRO mode
- [ ] Verificación de que PRE mode NO está activo

---

**Creado:** 11 de noviembre, 2025  
**Actualizado:** 11 de noviembre, 2025  
**Versión:** 1.0.0


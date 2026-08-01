# API Reference — Calixo Backend (Android)

Este documento describe la API REST del backend Node/Express que sustituye a las
API Routes de Next.js para que la app de Android (Android Studio) pueda
consumir el mismo backend/datos que la PWA (mismo proyecto Supabase).

- **Base URL (desarrollo):** `http://localhost:3001`
- **Base URL (producción):** la que definas al desplegar (Railway, Render, Fly.io, etc.)
- **Formato:** JSON (excepto subidas de archivo, que son `multipart/form-data`)
- **Autenticación:** Bearer JWT de Supabase Auth (ver sección siguiente)

---

## 1. Autenticación

Este backend **no reimplementa** login/registro: Android usa el **Supabase Kotlin SDK**
directamente contra el mismo proyecto Supabase que ya usa la PWA (mismas
`SUPABASE_URL` / `SUPABASE_ANON_KEY`). Una vez el usuario inicia sesión, Android
obtiene un `access_token` (JWT) de Supabase y lo manda en cada llamada a esta
API:

```
Authorization: Bearer <supabase_access_token>
```

El servidor valida ese token contra Supabase en cada request (`middleware/auth.ts`)
y expone:
- `req.user` → el usuario autenticado (si el token es válido)
- `req.supabase` → un cliente Supabase con Row Level Security aplicado **como
  ese usuario**, exactamente igual que hacía la PWA con cookies. Esto significa
  que las políticas RLS de tu base de datos siguen protegiendo los datos
  igual que antes; no hemos tenido que reescribir ninguna política.

### Flujo recomendado en Android (Kotlin)

```kotlin
// build.gradle.kts
implementation("io.github.jan-tennert.supabase:auth-kt:VERSION")
implementation("io.github.jan-tennert.supabase:postgrest-kt:VERSION") // opcional

val supabase = createSupabaseClient(
    supabaseUrl = "https://<tu-proyecto>.supabase.co",
    supabaseKey = "<SUPABASE_ANON_KEY>"
) {
    install(Auth)
}

// Login
supabase.auth.signInWith(Email) {
    email = "user@example.com"
    password = "..."
}

// Token para llamar a la API
val token = supabase.auth.currentSessionOrNull()?.accessToken

// Retrofit interceptor
class AuthInterceptor(private val tokenProvider: () -> String?) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = tokenProvider()
        val request = chain.request().newBuilder().apply {
            if (token != null) addHeader("Authorization", "Bearer $token")
        }.build()
        return chain.proceed(request)
    }
}
```

Supabase renueva el `access_token` automáticamente con el `refresh_token`; el
SDK de Android lo gestiona solo si usas `supabase.auth.currentSessionOrNull()`
para leer siempre el token vigente antes de cada llamada (o te suscribes a
`sessionStatus` para cachearlo).

### Rutas públicas (no requieren token)

Un pequeño número de endpoints son públicos porque también lo eran en la PWA
(usan el cliente anónimo o `service role` internamente):
`GET /api/banners`, `GET /api/store/coupons`, `GET /api/feed/:id/metadata`,
`POST /api/newsletter/subscribe`, `POST /api/stripe/webhook` (este último se
autentica con la firma de Stripe, no con Supabase).

### Rutas de administración

Todas las rutas bajo `/api/admin/*` (salvo `/api/admin/check`) requieren que el
usuario autenticado tenga `is_admin = true` en la tabla `users`. Si no,
responden `403 {'error': 'No autorizado'}`. `GET /api/admin/check` es la
que usa la app para decidir si mostrar el menú de administración.

---

## 2. Formato de errores

Todas las respuestas de error siguen el mismo formato que ya usaba la PWA:

```json
{ "error": "Mensaje descriptivo en español" }
```

Algunos errores incluyen además `details` con información adicional (p. ej.
errores de subida de archivos). Los códigos HTTP usados son los mismos que
en Next.js: `400` (validación), `401` (no autenticado), `403` (sin permiso),
`404` (no encontrado), `500` (error interno).

---

## 3. Subida de archivos

Los siguientes endpoints reciben `multipart/form-data` con un campo `file`
(igual que la PWA, que usaba `FormData`):

- `POST /api/upload` → imágenes de retos (bucket `challenge-images`)
- `POST /api/profile/photo` → foto de perfil (bucket `profile-photos`)
- `POST /api/admin/banners/upload` (admin) → bucket `banners`
- `POST /api/admin/coupons/upload` (admin) → bucket `banners/coupons/`

Límites: máximo 5MB, tipos permitidos `image/jpeg`, `image/png`, `image/webp`.

Ejemplo con Retrofit:

```kotlin
@Multipart
@POST("api/upload")
suspend fun uploadImage(@Part file: MultipartBody.Part): UploadResponse
```

---

## 4. Pagos (Stripe)

- `POST /api/stripe/checkout` — crea una sesión de checkout (o activa premium
  directamente si `APP_ENV=PRE`, útil para pruebas en Android sin pagar).
- `POST /api/stripe/portal` — sesión del portal de cliente de Stripe.
- `POST /api/stripe/webhook` — **no lo llama la app**, lo llama Stripe
  directamente a la URL pública del servidor. Debes configurar esa URL en el
  Dashboard de Stripe.

En Android, `checkout.url` es una URL que puedes abrir en un `CustomTabsIntent`
o `WebView` para completar el pago.

---

## 5. Referencia completa de endpoints


### `/api/admin`

| Método | Ruta completa | Origen (Next.js) |
|---|---|---|
| GET | `/api/admin/analytics` | `app/api/admin/analytics/route.ts` |
| GET | `/api/admin/banners` | `app/api/admin/banners/route.ts` |
| POST | `/api/admin/banners` | `app/api/admin/banners/route.ts` |
| DELETE | `/api/admin/banners/:id` | `app/api/admin/banners/[id]/route.ts` |
| PUT | `/api/admin/banners/:id` | `app/api/admin/banners/[id]/route.ts` |
| POST | `/api/admin/banners/upload` | `app/api/admin/banners/upload/route.ts` |
| GET | `/api/admin/challenges` | `app/api/admin/challenges/route.ts` |
| POST | `/api/admin/challenges` | `app/api/admin/challenges/route.ts` |
| DELETE | `/api/admin/challenges/:id` | `app/api/admin/challenges/[id]/route.ts` |
| PUT | `/api/admin/challenges/:id` | `app/api/admin/challenges/[id]/route.ts` |
| GET | `/api/admin/check` | `app/api/admin/check/route.ts` |
| GET | `/api/admin/config` | `app/api/admin/config/route.ts` |
| PUT | `/api/admin/config` | `app/api/admin/config/route.ts` |
| GET | `/api/admin/coupons` | `app/api/admin/coupons/route.ts` |
| POST | `/api/admin/coupons` | `app/api/admin/coupons/route.ts` |
| DELETE | `/api/admin/coupons/:id` | `app/api/admin/coupons/[id]/route.ts` |
| PUT | `/api/admin/coupons/:id` | `app/api/admin/coupons/[id]/route.ts` |
| POST | `/api/admin/coupons/upload` | `app/api/admin/coupons/upload/route.ts` |
| PUT | `/api/admin/moderation/:id/resolve` | `app/api/admin/moderation/[id]/resolve/route.ts` |
| GET | `/api/admin/moderation/hidden` | `app/api/admin/moderation/hidden/route.ts` |
| GET | `/api/admin/moderation/queue` | `app/api/admin/moderation/queue/route.ts` |
| POST | `/api/admin/moderation/restore` | `app/api/admin/moderation/restore/route.ts` |
| GET | `/api/admin/subscriptions/stats` | `app/api/admin/subscriptions/stats/route.ts` |
| GET | `/api/admin/users` | `app/api/admin/users/route.ts` |
| PUT | `/api/admin/users/:id/ban` | `app/api/admin/users/[id]/ban/route.ts` |
| PUT | `/api/admin/users/:id/premium` | `app/api/admin/users/[id]/premium/route.ts` |

### `/api/avatar`

| Método | Ruta completa | Origen (Next.js) |
|---|---|---|
| GET | `/api/avatar` | `app/api/avatar/route.ts` |
| POST | `/api/avatar` | `app/api/avatar/route.ts` |
| POST | `/api/avatar/equip` | `app/api/avatar/equip/route.ts` |

### `/api/banners`

| Método | Ruta completa | Origen (Next.js) |
|---|---|---|
| GET | `/api/banners` | `app/api/banners/route.ts` |

### `/api/challenges`

| Método | Ruta completa | Origen (Next.js) |
|---|---|---|
| GET | `/api/challenges` | `app/api/challenges/route.ts` |
| GET | `/api/challenges/active` | `app/api/challenges/active/route.ts` |
| POST | `/api/challenges/cancel` | `app/api/challenges/cancel/route.ts` |
| POST | `/api/challenges/claim` | `app/api/challenges/claim/route.ts` |
| POST | `/api/challenges/complete` | `app/api/challenges/complete/route.ts` |
| POST | `/api/challenges/fail` | `app/api/challenges/fail/route.ts` |
| POST | `/api/challenges/finish` | `app/api/challenges/finish/route.ts` |
| GET | `/api/challenges/social` | `app/api/challenges/social/route.ts` |
| POST | `/api/challenges/social` | `app/api/challenges/social/route.ts` |
| POST | `/api/challenges/social/:sessionId/accept` | `app/api/challenges/social/[sessionId]/accept/route.ts` |
| POST | `/api/challenges/start` | `app/api/challenges/start/route.ts` |

### `/api/feed`

| Método | Ruta completa | Origen (Next.js) |
|---|---|---|
| GET | `/api/feed` | `app/api/feed/route.ts` |
| POST | `/api/feed` | `app/api/feed/route.ts` |
| GET | `/api/feed/:id` | `app/api/feed/[id]/route.ts` |
| GET | `/api/feed/:id/comments` | `app/api/feed/[id]/comments/route.ts` |
| POST | `/api/feed/:id/comments` | `app/api/feed/[id]/comments/route.ts` |
| GET | `/api/feed/:id/like` | `app/api/feed/[id]/like/route.ts` |
| POST | `/api/feed/:id/like` | `app/api/feed/[id]/like/route.ts` |
| GET | `/api/feed/:id/metadata` | `app/api/feed/[id]/metadata/route.ts` |

### `/api/follow`

| Método | Ruta completa | Origen (Next.js) |
|---|---|---|
| POST | `/api/follow` | `app/api/follow/route.ts` |
| GET | `/api/follow/requests` | `app/api/follow/requests/route.ts` |
| DELETE | `/api/follow/requests/:id` | `app/api/follow/requests/[id]/route.ts` |
| PATCH | `/api/follow/requests/:id` | `app/api/follow/requests/[id]/route.ts` |

### `/api/groups`

| Método | Ruta completa | Origen (Next.js) |
|---|---|---|
| GET | `/api/groups` | `app/api/groups/route.ts` |
| POST | `/api/groups` | `app/api/groups/route.ts` |
| DELETE | `/api/groups/:id` | `app/api/groups/[id]/route.ts` |
| GET | `/api/groups/:id` | `app/api/groups/[id]/route.ts` |
| PATCH | `/api/groups/:id` | `app/api/groups/[id]/route.ts` |
| GET | `/api/groups/:id/challenges` | `app/api/groups/[id]/challenges/route.ts` |
| POST | `/api/groups/:id/challenges` | `app/api/groups/[id]/challenges/route.ts` |
| POST | `/api/groups/:id/challenges/:cid` | `app/api/groups/[id]/challenges/[cid]/route.ts` |
| PATCH | `/api/groups/:id/invitations/:invId` | `app/api/groups/[id]/invitations/[invId]/route.ts` |
| POST | `/api/groups/:id/invite` | `app/api/groups/[id]/invite/route.ts` |
| DELETE | `/api/groups/:id/members/:userId` | `app/api/groups/[id]/members/[userId]/route.ts` |
| GET | `/api/groups/:id/messages` | `app/api/groups/[id]/messages/route.ts` |
| POST | `/api/groups/:id/messages` | `app/api/groups/[id]/messages/route.ts` |
| DELETE | `/api/groups/:id/messages/:messageId` | `app/api/groups/[id]/messages/[messageId]/route.ts` |
| PATCH | `/api/groups/:id/read` | `app/api/groups/[id]/read/route.ts` |
| GET | `/api/groups/:id/stats` | `app/api/groups/[id]/stats/route.ts` |

### `/api/messages`

| Método | Ruta completa | Origen (Next.js) |
|---|---|---|
| GET | `/api/messages/conversations` | `app/api/messages/conversations/route.ts` |
| POST | `/api/messages/conversations` | `app/api/messages/conversations/route.ts` |
| GET | `/api/messages/conversations/:id/messages` | `app/api/messages/conversations/[id]/messages/route.ts` |
| PATCH | `/api/messages/conversations/:id/messages` | `app/api/messages/conversations/[id]/messages/route.ts` |
| POST | `/api/messages/conversations/:id/messages` | `app/api/messages/conversations/[id]/messages/route.ts` |
| DELETE | `/api/messages/conversations/:id/messages/:messageId` | `app/api/messages/conversations/[id]/messages/[messageId]/route.ts` |
| GET | `/api/messages/unread-count` | `app/api/messages/unread-count/route.ts` |

### `/api/newsletter`

| Método | Ruta completa | Origen (Next.js) |
|---|---|---|
| POST | `/api/newsletter/subscribe` | `app/api/newsletter/subscribe/route.ts` |

### `/api/notifications`

| Método | Ruta completa | Origen (Next.js) |
|---|---|---|
| GET | `/api/notifications` | `app/api/notifications/route.ts` |
| POST | `/api/notifications` | `app/api/notifications/route.ts` |
| DELETE | `/api/notifications/:id` | `app/api/notifications/[id]/route.ts` |
| POST | `/api/notifications/:id/read` | `app/api/notifications/[id]/read/route.ts` |
| POST | `/api/notifications/read-all` | `app/api/notifications/read-all/route.ts` |

### `/api/profile`

| Método | Ruta completa | Origen (Next.js) |
|---|---|---|
| GET | `/api/profile` | `app/api/profile/route.ts` |
| PATCH | `/api/profile` | `app/api/profile/route.ts` |
| GET | `/api/profile/:userId` | `app/api/profile/[userId]/route.ts` |
| GET | `/api/profile/:userId/feed` | `app/api/profile/[userId]/feed/route.ts` |
| GET | `/api/profile/:userId/followers` | `app/api/profile/[userId]/followers/route.ts` |
| GET | `/api/profile/:userId/following` | `app/api/profile/[userId]/following/route.ts` |
| GET | `/api/profile/challenges` | `app/api/profile/challenges/route.ts` |
| GET | `/api/profile/check-username` | `app/api/profile/check-username/route.ts` |
| GET | `/api/profile/followers` | `app/api/profile/followers/route.ts` |
| GET | `/api/profile/following` | `app/api/profile/following/route.ts` |
| DELETE | `/api/profile/photo` | `app/api/profile/photo/route.ts` |
| POST | `/api/profile/photo` | `app/api/profile/photo/route.ts` |

### `/api/reports`

| Método | Ruta completa | Origen (Next.js) |
|---|---|---|
| POST | `/api/reports` | `app/api/reports/route.ts` |

### `/api/store`

| Método | Ruta completa | Origen (Next.js) |
|---|---|---|
| GET | `/api/store` | `app/api/store/route.ts` |
| GET | `/api/store/coupons` | `app/api/store/coupons/route.ts` |
| POST | `/api/store/coupons/validate` | `app/api/store/coupons/validate/route.ts` |
| POST | `/api/store/purchase` | `app/api/store/purchase/route.ts` |
| GET | `/api/store/purchased` | `app/api/store/purchased/route.ts` |

### `/api/stripe`

| Método | Ruta completa | Origen (Next.js) |
|---|---|---|
| POST | `/api/stripe/checkout` | `app/api/stripe/checkout/route.ts` |
| POST | `/api/stripe/portal` | `app/api/stripe/portal/route.ts` |
| POST | `/api/stripe/webhook` | `app/api/stripe/webhook/route.ts` |

### `/api/transactions`

| Método | Ruta completa | Origen (Next.js) |
|---|---|---|
| GET | `/api/transactions` | `app/api/transactions/route.ts` |

### `/api/upload`

| Método | Ruta completa | Origen (Next.js) |
|---|---|---|
| POST | `/api/upload` | `app/api/upload/route.ts` |

### `/api/users`

| Método | Ruta completa | Origen (Next.js) |
|---|---|---|
| GET | `/api/users/search` | `app/api/users/search/route.ts` |

> 📄 El código fuente que generó cada ruta se conserva como comentario
> `// Migrated from app/api/...` al inicio de cada handler en
> `server/src/routes/*.routes.ts`, por si necesitas comparar el comportamiento
> exacto con el original.

---

## 6. Ejecutar el backend en local

```bash
cd server
cp .env.example .env   # rellena con las credenciales del MISMO proyecto Supabase que usa la PWA
npm install
npm run dev             # http://localhost:3001
```

Para que el emulador de Android Studio alcance `http://localhost:3001` desde
el propio emulador, usa `http://10.0.2.2:3001` como base URL (es el alias que
usa el emulador para referirse al host). En un dispositivo físico, usa la IP
de tu máquina en la red local, o despliega el backend (Railway/Render/Fly.io)
y usa esa URL pública.

## 7. Notas de la migración

- La lógica de negocio (consultas Supabase, reglas de retos, rachas, energía
  del avatar, etc.) es la misma que en la PWA; solo cambió el "transporte"
  (Express en vez de Next.js Route Handlers) y la autenticación (Bearer JWT
  en vez de cookies).
- `req.supabase` respeta RLS exactamente igual que en la PWA — no se ha
  bypassed ninguna política de seguridad.
- Dos endpoints de `profile/photo` simplifican un caso límite del original
  (fallback a "último usuario creado" cuando la sesión aún no estaba
  establecida durante el signup): en esta versión requieren sesión válida
  siempre, que es el comportamiento correcto para un cliente nativo.

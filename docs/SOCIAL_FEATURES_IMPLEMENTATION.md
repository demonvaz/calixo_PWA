# Sistema de Likes, Comentarios y Compartir - Implementación Completa

## 📋 Resumen

Se ha implementado un sistema completo de interacciones sociales para las publicaciones del feed, incluyendo:

1. **Sistema de Likes** con toggle (like/unlike)
2. **Sistema de Comentarios** con detección de menciones (@username)
3. **Sistema de Compartir** con soporte para múltiples redes sociales
4. **Sistema de Notificaciones** para likes, comentarios y menciones

---

## 🎯 Funcionalidades Implementadas

### 1. Sistema de Likes

#### Características:
- ✅ Toggle like/unlike (dar y quitar like)
- ✅ Tabla `feed_likes` para rastrear likes individuales
- ✅ Contador de likes actualizado automáticamente
- ✅ Verificación de estado de like al cargar el post
- ✅ Notificaciones al autor del post cuando recibe un like
- ✅ Optimistic UI updates para mejor UX

#### Archivos:
- `app/api/feed/[id]/like/route.ts` - Endpoints GET y POST para likes
- `docs/setup/CREATE_FEED_LIKES_TABLE.sql` - Script SQL para crear tabla de likes
- `components/feed/feed-post.tsx` - Componente actualizado con sistema de likes

#### Uso:
```typescript
// Verificar si el usuario dio like
GET /api/feed/[id]/like

// Toggle like/unlike
POST /api/feed/[id]/like
```

---

### 2. Sistema de Comentarios con Menciones

#### Características:
- ✅ Crear comentarios en publicaciones
- ✅ Detección automática de menciones con formato `@username`
- ✅ Notificaciones al autor del post cuando recibe un comentario
- ✅ Notificaciones a usuarios mencionados (@username)
- ✅ Formato visual de menciones como enlaces clickeables
- ✅ Validación de comentarios vacíos

#### Archivos:
- `app/api/feed/[id]/comments/route.ts` - Endpoints GET y POST para comentarios
- `lib/utils/mentions.ts` - Utilidades para detectar y procesar menciones
- `components/feed/feed-comments.tsx` - Componente actualizado con formato de menciones

#### Uso:
```typescript
// Obtener comentarios
GET /api/feed/[id]/comments

// Crear comentario
POST /api/feed/[id]/comments
{
  "comment": "¡Genial! @usuario1 también debería ver esto"
}
```

#### Detección de Menciones:
- Formato: `@username` (sin espacios después del @)
- Las menciones se detectan automáticamente al crear el comentario
- Se crean notificaciones para cada usuario mencionado
- Las menciones se muestran como enlaces clickeables en los comentarios

---

### 3. Sistema de Compartir

#### Características:
- ✅ Modal de compartir con múltiples opciones
- ✅ Compartir en WhatsApp, Twitter, Facebook, Telegram, LinkedIn, Reddit
- ✅ Compartir por email
- ✅ Copiar enlace al portapapeles
- ✅ Compartir nativo (Web Share API) en dispositivos móviles
- ✅ Metadata Open Graph y Twitter Cards para previews
- ✅ Endpoint público para metadata de publicación

#### Archivos:
- `components/feed/share-post-modal.tsx` - Modal de compartir
- `app/api/feed/[id]/metadata/route.ts` - Endpoint público para metadata
- `app/feed/[id]/metadata.ts` - Generación de metadata para SEO

#### Redes Sociales Soportadas:
- 📱 WhatsApp
- 🐦 Twitter/X
- 📘 Facebook
- ✈️ Telegram
- 💼 LinkedIn
- 🤖 Reddit
- 📧 Email
- 📋 Copiar enlace (para Instagram, etc.)

#### Metadata para Redes Sociales:
```typescript
// Endpoint público para obtener metadata
GET /api/feed/[id]/metadata

// Retorna:
{
  "title": "Usuario completó: Reto Diario",
  "description": "Mira esta publicación...",
  "image": "https://...",
  "url": "https://calixo.app/feed/123"
}
```

---

### 4. Sistema de Notificaciones

#### Tipos de Notificaciones:
1. **Like** (`feed_like`):
   - Se crea cuando alguien da like a tu publicación
   - Mensaje: "{usuario} le dio like a tu publicación"

2. **Comentario** (`feed_comment`):
   - Se crea cuando alguien comenta en tu publicación
   - Mensaje: "{usuario} comentó en tu publicación"
   - Solo si no eres el autor del comentario

3. **Mención** (`feed_mention`):
   - Se crea cuando alguien te menciona en un comentario
   - Mensaje: "{usuario} te mencionó en un comentario"
   - Solo si no eres el autor del comentario ni del post

#### Estructura de Notificación:
```typescript
{
  user_id: string,
  type: 'social',
  title: string,
  message: string,
  payload: {
    type: 'feed_like' | 'feed_comment' | 'feed_mention',
    feedItemId: number,
    commenterId?: string,
    likerId?: string,
    comment?: string
  },
  seen: false
}
```

---

## 🗄️ Base de Datos

### Nueva Tabla: `feed_likes`

```sql
CREATE TABLE feed_likes (
  id SERIAL PRIMARY KEY,
  feed_item_id INTEGER NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(feed_item_id, user_id)
);
```

### Triggers Automáticos:
- Actualiza `likes_count` en `feed_items` automáticamente
- Incrementa al dar like
- Decrementa al quitar like

---

## 📱 Componentes Actualizados

### `FeedPost`
- ✅ Verifica estado de like al cargar
- ✅ Toggle like/unlike con optimistic updates
- ✅ Modal de compartir integrado
- ✅ Iconos visuales para likes (❤️/🤍)

### `FeedComments`
- ✅ Formato de menciones como enlaces
- ✅ Detección visual de @username
- ✅ Enlaces a perfiles de usuarios mencionados

### `SharePostModal`
- ✅ Interfaz moderna y responsive
- ✅ Soporte para múltiples redes sociales
- ✅ Compartir nativo en móviles
- ✅ Copiar enlace al portapapeles

---

## 🚀 Cómo Usar

### 1. Configurar Base de Datos

Ejecutar el script SQL para crear la tabla de likes:

```bash
# En Supabase SQL Editor o tu cliente PostgreSQL
psql -f docs/setup/CREATE_FEED_LIKES_TABLE.sql
```

### 2. Dar Like a una Publicación

```typescript
// En el componente
const handleLike = async () => {
  const response = await fetch(`/api/feed/${postId}/like`, {
    method: 'POST',
  });
  const data = await response.json();
  // data.isLiked indica si ahora está liked
  // data.likesCount tiene el nuevo contador
};
```

### 3. Comentar con Menciones

```typescript
// El usuario escribe: "¡Genial! @usuario1 debería ver esto"
const response = await fetch(`/api/feed/${postId}/comments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    comment: "¡Genial! @usuario1 debería ver esto"
  }),
});
// Automáticamente se crean notificaciones para:
// - El autor del post
// - @usuario1 (si existe)
```

### 4. Compartir Publicación

```typescript
// Abrir modal de compartir
<SharePostModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  postUrl="https://calixo.app/feed/123"
  postTitle="Usuario completó: Reto Diario"
  postImage="https://..."
/>
```

---

## 🔒 Seguridad

### Row Level Security (RLS):
- ✅ Usuarios solo pueden dar like a sus propias cuentas
- ✅ Usuarios solo pueden eliminar sus propios likes
- ✅ Todos pueden ver likes (público)
- ✅ Comentarios respetan permisos de feed_items

### Validaciones:
- ✅ Comentarios no pueden estar vacíos
- ✅ Menciones se validan contra usuarios existentes
- ✅ No se crean notificaciones duplicadas
- ✅ No se notifica al autor si se menciona a sí mismo

---

## 📊 Mejoras Futuras

### Posibles Mejoras:
- [ ] Respuestas a comentarios (threads)
- [ ] Editar/eliminar comentarios propios
- [ ] Reacciones adicionales (me encanta, me divierte, etc.)
- [ ] Compartir en más redes sociales
- [ ] Analytics de compartidos
- [ ] Preview mejorado de enlaces compartidos
- [ ] Autocompletado de menciones mientras escribes
- [ ] Notificaciones push para menciones importantes

---

## 🐛 Solución de Problemas

### Los likes no se guardan
- Verificar que la tabla `feed_likes` existe
- Verificar permisos RLS en Supabase
- Revisar logs del servidor

### Las menciones no funcionan
- Verificar que el formato es `@username` (sin espacios)
- Verificar que el usuario existe en la base de datos
- Los nombres de usuario deben coincidir exactamente (case-sensitive)

### El compartir no muestra preview
- Verificar que el endpoint `/api/feed/[id]/metadata` funciona
- Verificar metadata Open Graph en el HTML
- Usar herramientas como [Open Graph Debugger](https://www.opengraph.xyz/)

---

## ✅ Checklist de Implementación

- [x] Tabla `feed_likes` creada
- [x] Endpoints de likes implementados
- [x] Sistema de toggle like/unlike funcionando
- [x] Detección de menciones implementada
- [x] Notificaciones para likes, comentarios y menciones
- [x] Componente de compartir creado
- [x] Metadata Open Graph configurada
- [x] Soporte para múltiples redes sociales
- [x] Formato visual de menciones en comentarios
- [x] Optimistic UI updates para likes
- [x] Documentación completa

---

## 📚 Referencias

- [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

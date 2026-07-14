# Mensajería Privada — Calixo PWA

Documentación del sistema de mensajes directos (DMs) entre usuarios.

**Última revisión:** Julio 2026

---

## Visión general

Los mensajes privados viven en la pestaña **Mensajes** (`/messages`). Cada conversación es 1:1 entre dos usuarios. El chat grupal usa tablas separadas (ver [GROUPS.md](./GROUPS.md)).

## Estados de lectura (UI)

Los ticks (✓✓) se sustituyeron por **avatares de perfil superpuestos** de quien ha leído el mensaje.

| Contexto | Comportamiento |
|----------|----------------|
| DM | Avatar del destinatario cuando ha leído |
| Grupo | Avatares superpuestos de lectores (máx. 2 visibles + "+X más") |

Estados internos (`sent`, `delivered`, `seen`) se mantienen en BD; en UI solo se muestran avatares cuando hay lectores confirmados.

## Acciones de mensaje

Menú contextual (⋮) en cada mensaje:
- **Info** — fecha, lista completa de lectores
- **Copiar** — texto al portapapeles
- **Eliminar** — solo mensajes propios

## Modelo de datos

| Tabla | Propósito |
|-------|-----------|
| `conversations` | Conversación directa |
| `conversation_participants` | Miembros + `last_read_message_id` |
| `messages` | Contenido, imagen opcional, status |
| `message_read_receipts` | Registro granular de lectura |

Migración: `supabase/migrations/20260714000001_messaging_system.sql`

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/messages/conversations` | Inbox con preview y unread |
| POST | `/api/messages/conversations` | Crear/obtener DM `{ recipientId }` |
| GET | `/api/messages/conversations/[id]/messages` | Historial paginado |
| POST | `/api/messages/conversations/[id]/messages` | Enviar mensaje |
| PATCH | `/api/messages/conversations/[id]/messages` | Marcar visto |
| DELETE | `/api/messages/conversations/[id]/messages/[messageId]` | Eliminar mensaje propio |
| GET | `/api/messages/unread-count` | Badge de no leídos |

## Reglas de negocio

- Cualquier usuario autenticado puede iniciar DM con otro usuario existente
- Un par de usuarios comparte una única conversación directa (deduplicada en POST)
- Polling: 15s en chat activo, 30s en background (badge nav)
- Notificaciones in-app tipo `dm_received` al recibir mensaje

## RLS

Solo participantes de la conversación pueden leer/escribir mensajes. El remitente debe ser `auth.uid()`.

## Frontend

```
app/messages/page.tsx
app/messages/[conversationId]/page.tsx
components/messages/
```

Entrada desde perfil público y búsqueda de usuarios.

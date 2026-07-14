# Grupos — Calixo PWA

Documentación del sistema de grupos estilo WhatsApp.

**Última revisión:** Julio 2026

---

## Visión general

Los grupos viven en la pestaña **Grupos** (`/groups`). Cada grupo tiene tres sub-secciones:

- **Chat** — mensajes grupales
- **Reto** — reto grupal (ver [GROUP_CHALLENGES.md](./GROUP_CHALLENGES.md))
- **Estadísticas** — métricas del grupo

## Modelo de datos

La tabla principal se llama `chat_groups` (evita conflicto con palabra reservada SQL `groups`).

| Tabla | Propósito |
|-------|-----------|
| `chat_groups` | Nombre, descripción, avatar, creador |
| `group_members` | Miembros con rol `admin` o `member` |
| `group_invitations` | Invitaciones pendientes |
| `group_messages` | Chat grupal |
| `group_message_reads` | Último mensaje leído por usuario |

Migración: `supabase/migrations/20260714000002_groups_system.sql`

## Roles

| Rol | Permisos |
|-----|----------|
| `admin` | Editar grupo, invitar, expulsar, organizar retos |
| `member` | Chatear, participar en retos, salir del grupo |

El creador se añade automáticamente como `admin` (trigger).

**Límite:** máximo **15 miembros** por grupo (validado al invitar y al aceptar invitación).

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/groups` | Listar / crear grupo |
| GET/PATCH | `/api/groups/[id]` | Detalle / editar |
| POST | `/api/groups/[id]/invite` | Invitar usuario |
| PATCH | `/api/groups/[id]/invitations/[invId]` | Aceptar/rechazar |
| DELETE | `/api/groups/[id]/members/[userId]` | Salir/expulsar |
| GET/POST | `/api/groups/[id]/messages` | Chat |
| DELETE | `/api/groups/[id]/messages/[messageId]` | Eliminar mensaje propio |
| PATCH | `/api/groups/[id]/read` | Marcar chat leído |
| GET | `/api/groups/[id]/stats` | Estadísticas |

## Flujo de invitación

1. Miembro invita → `group_invitations` status `pending`
2. Invitado recibe notificación `group_invite`
3. Acepta → se inserta en `group_members`, invitation `accepted`
4. Rechaza → invitation `rejected`

## Frontend

```
app/groups/page.tsx
app/groups/new/page.tsx
app/groups/[id]/layout.tsx
app/groups/[id]/chat/page.tsx
app/groups/[id]/challenge/page.tsx
app/groups/[id]/stats/page.tsx
components/groups/
```

## RLS

Acceso restringido a miembros del grupo. Solo admins pueden editar metadatos del grupo o expulsar miembros.

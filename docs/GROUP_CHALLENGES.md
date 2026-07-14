# Retos Grupales — Calixo PWA

Documentación del nuevo tipo de reto: desconexión grupal con apuestas.

**Última revisión:** Julio 2026

---

## Reglas de negocio

### Duración y premio base

- **Mínimo:** 30 minutos
- **Incrementos:** múltiplos de 30 minutos
- **Premio base:** `floor(duration_minutes / 30)` monedas
  - Ejemplo: 90 min → 3 monedas base

### Ganadores

Los miembros que **no cogieron el móvil** durante el reto comparten el bote.

**Detección (Visibility API — PWA):**
- `document.visibilitychange` → `hidden`
- `window.pagehide`
- `window.blur` (refuerzo móvil)

Primer evento de salida = `status: failed` para ese participante.

### Apuestas

- Opcional, antes del inicio (fase `betting`)
- Cada participante apuesta N monedas → se descuentan de `users.coins`
- Las apuestas se suman a `total_pot`

### Reparto del bote

```
total_pot = base_reward + sum(bet_amount de todos los participantes)
premio_por_ganador = floor(total_pot / num_ganadores)
```

- Si **0 ganadores:** devolver apuestas a cada participante
- Si **≥1 ganador:** reparto equitativo entre ganadores

### Límites semanales

- **Semana ISO** en timezone `Europe/Madrid` (`YYYY-Www`)
- **Grupo free:** máximo 1 reto/semana (organizador no-premium)
- **Miembro premium:** puede organizar retos **ilimitados** (`is_premium_override = true`)
- Solo el miembro premium puede ser `organizer_id` de retos extra semanales

Función SQL: `can_create_group_challenge(group_id, organizer_id)`

## Ciclo de vida

```
betting → in_progress → finished → distributed
         ↘ canceled
```

| Estado | Descripción |
|--------|-------------|
| `betting` | Fase de apuestas antes del inicio |
| `in_progress` | Timer activo con Visibility API |
| `finished` | Timer completado, pendiente reparto |
| `distributed` | Monedas repartidas |
| `canceled` | Cancelado por organizador |

## Modelo de datos

| Tabla | Propósito |
|-------|-----------|
| `group_challenges` | Reto: duración, bote, semana, organizador |
| `group_challenge_participants` | Apuesta, status, session_data, failed_at |

Migración: `supabase/migrations/20260714000003_group_challenges.sql`

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/groups/[id]/challenges` | Historial + activo |
| POST | `/api/groups/[id]/challenges` | Crear reto |
| POST | `.../challenges/[cid]/bet` | Apostar monedas |
| POST | `.../challenges/[cid]/start` | Iniciar reto |
| POST | `.../challenges/[cid]/report-failure` | Fallo por visibility |
| POST | `.../challenges/[cid]/finish` | Finalizar timer |
| POST | `.../challenges/[cid]/distribute` | Repartir bote |

## Diferencia vs retos individuales

| Individual (`challenge-timer.tsx`) | Grupal (`group-challenge-timer.tsx`) |
|-----------------------------------|--------------------------------------|
| Sistema de confianza | Visibility API estricta |
| Recompensa individual | Bote compartido |
| Sin apuestas | Apuestas opcionales |

## Limitaciones PWA

En iOS PWA la Visibility API puede ser imprecisa. Se documenta que el usuario debe mantener la app en primer plano. Los eventos se registran en `session_data` para auditoría admin.

## Notificaciones

- `group_challenge_created` — nuevo reto en el grupo
- `group_challenge_starting` — reto a punto de empezar
- `group_challenge_won` / `group_challenge_lost` — resultado

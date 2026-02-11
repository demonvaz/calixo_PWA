# Configuración del Cron de Decaimiento de Energía

Este documento explica cómo configurar el decaimiento diario de energía del avatar en Supabase.

## ¿Qué hace?

Cada día a las 00:00 UTC, el cron aplica decaimiento de energía a usuarios inactivos:
- **-2 energía** por día sin completar retos
- **Máximo 50** de pérdida por ejecución
- **Protección contra doble ejecución**: si el cron se ejecuta dos veces el mismo día, solo aplica el decay una vez

## Dónde configurarlo en Supabase

### Opción 1: SQL Editor (recomendado)

1. Entra al **Dashboard de Supabase** en [supabase.com](https://supabase.com)
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **SQL Editor**
4. Clic en **New query**
5. Abre el archivo `docs/setup/ENERGY_DECAY_CRON.sql` del proyecto
6. Copia **todo** el contenido
7. Pégalo en el editor SQL
8. Haz clic en **Run** (o `Ctrl+Enter`)

### Opción 2: Integrations → Cron

Si prefieres crear el job desde la interfaz:

1. **Project Settings** → **Integrations** → **Cron**
2. **Create job**
3. Configura:
   - **Name:** `avatar-energy-decay-daily`
   - **Schedule:** `0 0 * * *` (o "Every day at midnight")
   - **Command:** `SELECT public.update_avatar_energy_decay()`

**Nota:** Primero debes ejecutar el SQL de `ENERGY_DECAY_CRON.sql` (pasos 1-3) para crear la función y la columna `last_energy_decay_date`.

## Verificación

- **Historial de ejecuciones:** Integrations → Cron → botón **History** del job `avatar-energy-decay-daily`
- **Ejecución manual:** En SQL Editor ejecuta `SELECT public.update_avatar_energy_decay();`

## Zona horaria

El cron usa UTC. Para medianoche en España en invierno (CET): usa `0 23 * * *` (23:00 UTC = 00:00 CET).

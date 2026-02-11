-- ============================================================
-- Calixo: Decaimiento diario de energía del avatar (avatar_energy)
-- Con protección contra doble ejecución
--
-- DÓNDE EJECUTAR EN SUPABASE:
-- 1. Dashboard Supabase → SQL Editor (menú lateral)
-- 2. New query
-- 3. Pegar todo este archivo y ejecutar (Run)
--
-- Alternativa: Project Settings → Integrations → Cron → Create job
-- - Name: avatar-energy-decay-daily
-- - Schedule: 0 0 * * *
-- - Command: SELECT public.update_avatar_energy_decay()
-- (Primero ejecuta los pasos 1-3 de este script para crear la función)
-- ============================================================

-- 1. Habilitar extensión pg_cron (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Añadir columna para rastrear última ejecución del decay (protección doble ejecución)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_energy_decay_date DATE;

-- 3. Función que aplica el decaimiento de energía por inactividad
-- Reglas: -2 energía por día inactivo, máximo 50 de pérdida
-- Última actividad = último reto completado, o updated_at/created_at
-- Solo aplica si no se ejecutó ya hoy (last_energy_decay_date < CURRENT_DATE)
CREATE OR REPLACE FUNCTION public.update_avatar_energy_decay()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH user_last_activity AS (
    SELECT 
      u.id,
      COALESCE(u.avatar_energy, 100) AS current_energy,
      COALESCE(
        (SELECT MAX(uc.completed_at)::date 
         FROM user_challenges uc 
         WHERE uc.user_id = u.id AND uc.status = 'completed'),
        COALESCE(u.updated_at::date, u.created_at::date)
      ) AS last_activity,
      u.last_energy_decay_date
    FROM users u
  ),
  users_to_update AS (
    SELECT 
      id,
      current_energy,
      last_activity,
      GREATEST(0, (CURRENT_DATE - last_activity)::integer) AS days_inactive
    FROM user_last_activity
    WHERE last_activity < CURRENT_DATE
      AND (last_energy_decay_date IS NULL OR last_energy_decay_date < CURRENT_DATE)
  )
  UPDATE users u
  SET 
    avatar_energy = GREATEST(0, LEAST(100, 
      utu.current_energy - LEAST(utu.days_inactive * 2, 50)
    )),
    updated_at = now(),
    last_energy_decay_date = CURRENT_DATE
  FROM users_to_update utu
  WHERE u.id = utu.id;
END;
$$;

-- 4. Programar el cron: ejecutar cada día a las 00:00 UTC
-- Nota: Si el job ya existe, se sobrescribirá con la misma configuración
SELECT cron.schedule(
  'avatar-energy-decay-daily',
  '0 0 * * *',
  $$SELECT public.update_avatar_energy_decay()$$
);

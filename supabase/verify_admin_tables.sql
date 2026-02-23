-- Script de verificación: Tablas necesarias para el Admin Panel de Calixo
-- Ejecutar en Supabase SQL Editor (supabase_calixo - alpdtdumurvyhzmyoapn)
-- Si alguna tabla falta, ejecutar: supabase/migrations/20250215000001_admin_panel_tables.sql

-- Lista de tablas requeridas por el admin panel:
-- 1. users (id, display_name, is_premium, coins, streak, is_admin, created_at, updated_at)
-- 2. challenges
-- 3. user_challenges
-- 4. transactions
-- 5. feed_items
-- 6. reports
-- 7. subscriptions
-- 8. coupons
-- 9. feed_banners
-- 10. config

SELECT
  t.tabla,
  CASE WHEN ist.table_name IS NOT NULL THEN 'OK' ELSE 'FALTA' END AS estado
FROM (VALUES
  ('users'), ('challenges'), ('user_challenges'), ('transactions'),
  ('feed_items'), ('reports'), ('subscriptions'), ('coupons'),
  ('feed_banners'), ('config')
) AS t(tabla)
LEFT JOIN information_schema.tables ist
  ON ist.table_schema = 'public' AND ist.table_name = t.tabla
ORDER BY t.tabla;

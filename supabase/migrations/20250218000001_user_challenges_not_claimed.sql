-- Añadir status 'not_claimed' para retos finalizados pero no reclamados antes del cambio diario (2 AM Madrid)
-- La columna status es TEXT, no requiere alteración de tipo.
-- Si existe un CHECK constraint en status, descomentar y ajustar según el constraint actual:

-- Ejemplo si hubiera: ALTER TABLE user_challenges DROP CONSTRAINT IF EXISTS user_challenges_status_check;
-- ALTER TABLE user_challenges ADD CONSTRAINT user_challenges_status_check 
--   CHECK (status IN ('pending','in_progress','finished','claimed','completed','failed','canceled','not_claimed'));

COMMENT ON COLUMN user_challenges.status IS 'pending, in_progress, finished, claimed, completed, failed, canceled, not_claimed (expira si no se reclama antes de las 2 AM)';

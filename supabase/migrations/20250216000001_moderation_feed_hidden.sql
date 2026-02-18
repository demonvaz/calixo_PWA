-- Añadir is_hidden a feed_items (ocultar sin borrar)
ALTER TABLE feed_items
ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;

-- Añadir moderation_note a reports (descripción del admin al resolver)
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS moderation_note TEXT;

-- Índice para filtrar feed visible
CREATE INDEX IF NOT EXISTS idx_feed_items_is_hidden ON feed_items(is_hidden) WHERE is_hidden = false;

COMMENT ON COLUMN feed_items.is_hidden IS 'Si true, el post está oculto por moderación (no se borra)';
COMMENT ON COLUMN reports.moderation_note IS 'Nota del admin al aprobar o rechazar el reporte';

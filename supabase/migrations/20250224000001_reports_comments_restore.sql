-- Migración: Reportes de comentarios, vista previa y restaurar posts
-- Añade feed_comment_id a reports, is_hidden a feed_comments, y soporte para restaurar posts

-- 1. Crear feed_comments si no existe (puede existir en otro proyecto)
CREATE TABLE IF NOT EXISTS feed_comments (
  id SERIAL PRIMARY KEY,
  feed_item_id INTEGER NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Añadir is_hidden a feed_comments si no existe
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feed_comments' AND column_name = 'is_hidden') THEN
    ALTER TABLE feed_comments ADD COLUMN is_hidden BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 3. Añadir feed_comment_id a reports
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'feed_comment_id') THEN
    ALTER TABLE reports ADD COLUMN feed_comment_id INTEGER REFERENCES feed_comments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_feed_comments_feed_item_id ON feed_comments(feed_item_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_is_hidden ON feed_comments(is_hidden) WHERE is_hidden = false;
CREATE INDEX IF NOT EXISTS idx_reports_feed_comment_id ON reports(feed_comment_id) WHERE feed_comment_id IS NOT NULL;

COMMENT ON COLUMN feed_comments.is_hidden IS 'Si true, el comentario está oculto por moderación';
COMMENT ON COLUMN reports.feed_comment_id IS 'ID del comentario reportado (opcional)';

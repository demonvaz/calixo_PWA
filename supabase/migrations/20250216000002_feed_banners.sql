-- Banners publicitarios para el feed (aparecen cada 10 publicaciones)
-- Cada banner tiene: frase + imagen (opcional, por defecto /photos/back.PNG)

CREATE TABLE IF NOT EXISTS feed_banners (
  id SERIAL PRIMARY KEY,
  phrase TEXT NOT NULL,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_banners_active ON feed_banners(is_active) WHERE is_active = true;

COMMENT ON TABLE feed_banners IS 'Banners publicitarios del feed. Cada 10 posts se muestra uno aleatorio.';
COMMENT ON COLUMN feed_banners.phrase IS 'Texto/frase que aparece sobre la imagen';
COMMENT ON COLUMN feed_banners.image_url IS 'URL de la imagen (Supabase Storage o ruta pública). Si null, se usa /photos/back.PNG';

-- NOTA: Crear bucket "banners" en Supabase Dashboard > Storage > New bucket
-- Nombre: banners | Public: sí (para que las URLs funcionen)

-- Insertar banners por defecto solo si la tabla está vacía (evita duplicados con 20250215000001)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM feed_banners LIMIT 1) THEN
    INSERT INTO feed_banners (phrase, image_url, sort_order, is_active) VALUES
      ('Quizás sea mejor que dejes de scrollear, y salgas a acumular momentos', NULL, 0, true),
      ('Tienes muchos retos por hacer, desconecta un poco', NULL, 1, true),
      ('La vida está ahí fuera esperándote', NULL, 2, true),
      ('Tu dedo merece un descanso, ¿qué tal un reto?', NULL, 3, true),
      ('Menos scroll, más momentos memorables', NULL, 4, true);
  END IF;
END $$;

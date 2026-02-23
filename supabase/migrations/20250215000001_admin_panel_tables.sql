-- Migración: Tablas necesarias para el Admin Panel de Calixo
-- Proyecto: alpdtdumurvyhzmyoapn (supabase_calixo)
-- Ejecutar en Supabase SQL Editor o: supabase db push

-- =============================================================================
-- 1. USERS - Tabla principal de usuarios (referencia auth.users)
-- Si no existe, crearla. La app usa: id, display_name, is_premium, coins, streak, is_admin, created_at, updated_at
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_energy INTEGER DEFAULT 100,
  is_private BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  coins INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  gender TEXT,
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Añadir is_admin si no existe (para permisos del admin panel)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_admin') THEN
    ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);
CREATE INDEX IF NOT EXISTS idx_users_is_premium ON users(is_premium);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at);

-- =============================================================================
-- 2. CHALLENGES - Catálogo de retos
-- =============================================================================
CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reward INTEGER NOT NULL DEFAULT 10,
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 3. USER_CHALLENGES - Retos por usuario
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_challenges (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON user_challenges(status);

-- =============================================================================
-- 4. TRANSACTIONS - Historial de monedas
-- =============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id INTEGER REFERENCES challenges(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
  description TEXT,
  coupon_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_coupon_code ON transactions(coupon_code);

-- =============================================================================
-- 5. FEED_ITEMS - Posts del feed
-- =============================================================================
CREATE TABLE IF NOT EXISTS feed_items (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_challenge_id INTEGER REFERENCES user_challenges(id) ON DELETE SET NULL,
  image_url TEXT,
  note TEXT,
  likes_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_items_user_id ON feed_items(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_is_hidden ON feed_items(is_hidden) WHERE is_hidden = false;

-- =============================================================================
-- 6. REPORTS - Reportes de contenido
-- =============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feed_item_id INTEGER REFERENCES feed_items(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  moderation_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- =============================================================================
-- 7. SUBSCRIPTIONS - Suscripciones Stripe
-- =============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL,
  plan TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- =============================================================================
-- 8. COUPONS - Cupones de descuento
-- =============================================================================
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  partner_name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, valid_until);

-- =============================================================================
-- 9. FEED_BANNERS - Banners del feed
-- =============================================================================
CREATE TABLE IF NOT EXISTS feed_banners (
  id SERIAL PRIMARY KEY,
  phrase TEXT NOT NULL,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_banners_active ON feed_banners(is_active) WHERE is_active = true;

-- =============================================================================
-- 10. CONFIG - Configuración global
-- =============================================================================
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- RLS básico (habilitar en tablas que no lo tengan)
-- =============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Política para service_role (bypass RLS en operaciones admin)
-- El service_role key de Supabase ya bypassa RLS por defecto

-- Insertar banners por defecto si la tabla está vacía
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

-- Insertar config por defecto
INSERT INTO config (key, value, updated_at) VALUES
  ('daily_challenges_free', '1'::jsonb, now()),
  ('daily_challenges_premium', '3'::jsonb, now()),
  ('max_focus_duration_hours', '23'::jsonb, now()),
  ('default_reward', '10'::jsonb, now()),
  ('premium_price_monthly', '4.99'::jsonb, now()),
  ('premium_price_annual', '49.99'::jsonb, now()),
  ('avatar_energy_initial', '100'::jsonb, now()),
  ('energy_threshold_high', '70'::jsonb, now()),
  ('energy_threshold_medium', '40'::jsonb, now())
ON CONFLICT (key) DO NOTHING;

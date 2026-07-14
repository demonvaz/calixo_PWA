-- Migración: Retos grupales con apuestas y reparto de premios

-- =============================================================================
-- ENUMS
-- =============================================================================
DO $$ BEGIN
  CREATE TYPE group_challenge_status AS ENUM (
    'scheduled', 'betting', 'in_progress', 'finished', 'distributed', 'canceled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE group_participant_status AS ENUM (
    'invited', 'bet_placed', 'active', 'success', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- GROUP CHALLENGES
-- =============================================================================
CREATE TABLE IF NOT EXISTS group_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 30 AND duration_minutes % 30 = 0),
  status group_challenge_status NOT NULL DEFAULT 'betting',
  week_key TEXT NOT NULL,
  base_reward INTEGER NOT NULL DEFAULT 0,
  total_pot INTEGER NOT NULL DEFAULT 0,
  scheduled_start TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  is_premium_override BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_challenges_group_id ON group_challenges(group_id);
CREATE INDEX IF NOT EXISTS idx_group_challenges_week ON group_challenges(group_id, week_key);
CREATE INDEX IF NOT EXISTS idx_group_challenges_status ON group_challenges(status);

-- =============================================================================
-- GROUP CHALLENGE PARTICIPANTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS group_challenge_participants (
  group_challenge_id UUID NOT NULL REFERENCES group_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bet_amount INTEGER NOT NULL DEFAULT 0 CHECK (bet_amount >= 0),
  status group_participant_status NOT NULL DEFAULT 'invited',
  failed_at TIMESTAMPTZ,
  session_data JSONB DEFAULT '{}',
  PRIMARY KEY (group_challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_challenge_participants_user ON group_challenge_participants(user_id);

-- =============================================================================
-- EXTEND TRANSACTIONS
-- =============================================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'group_challenge_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN group_challenge_id UUID REFERENCES group_challenges(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN group_id UUID REFERENCES chat_groups(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =============================================================================
-- HELPER: can create group challenge (week limit + premium)
-- =============================================================================
CREATE OR REPLACE FUNCTION can_create_group_challenge(
  p_group_id UUID,
  p_organizer_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_week_key TEXT;
  v_non_premium_count INTEGER;
BEGIN
  SELECT is_premium INTO v_is_premium FROM users WHERE id = p_organizer_id;

  -- ISO week key: YYYY-Www
  v_week_key := to_char(now() AT TIME ZONE 'Europe/Madrid', 'IYYY-"W"IW');

  IF v_is_premium THEN
    RETURN true;
  END IF;

  SELECT COUNT(*) INTO v_non_premium_count
  FROM group_challenges
  WHERE group_id = p_group_id
    AND week_key = v_week_key
    AND is_premium_override = false
    AND status NOT IN ('canceled');

  RETURN v_non_premium_count < 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE group_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_challenge_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS group_challenges_select ON group_challenges;
CREATE POLICY group_challenges_select ON group_challenges
  FOR SELECT USING (is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS group_challenges_insert ON group_challenges;
CREATE POLICY group_challenges_insert ON group_challenges
  FOR INSERT WITH CHECK (
    organizer_id = auth.uid()
    AND is_group_member(group_id, auth.uid())
  );

DROP POLICY IF EXISTS group_challenges_update ON group_challenges;
CREATE POLICY group_challenges_update ON group_challenges
  FOR UPDATE USING (is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS group_challenge_participants_select ON group_challenge_participants;
CREATE POLICY group_challenge_participants_select ON group_challenge_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_challenges gc
      WHERE gc.id = group_challenge_id
        AND is_group_member(gc.group_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS group_challenge_participants_insert ON group_challenge_participants;
CREATE POLICY group_challenge_participants_insert ON group_challenge_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS group_challenge_participants_update ON group_challenge_participants;
CREATE POLICY group_challenge_participants_update ON group_challenge_participants
  FOR UPDATE USING (user_id = auth.uid());

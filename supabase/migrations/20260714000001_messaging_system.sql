-- Migración: Sistema de mensajería privada (DMs)
-- Estados estilo Instagram: sent → delivered → seen

-- =============================================================================
-- ENUMS
-- =============================================================================
DO $$ BEGIN
  CREATE TYPE conversation_type AS ENUM ('direct');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'seen');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- CONVERSATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type conversation_type NOT NULL DEFAULT 'direct',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- =============================================================================
-- CONVERSATION PARTICIPANTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_message_id BIGINT,
  last_read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- =============================================================================
-- MESSAGES
-- =============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  status message_status NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT messages_content_or_image CHECK (content <> '' OR image_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- =============================================================================
-- MESSAGE READ RECEIPTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS message_read_receipts (
  message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_id ON message_read_receipts(user_id);

-- =============================================================================
-- TRIGGER: update conversation.updated_at on new message
-- =============================================================================
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_messages_update_conversation ON messages;
CREATE TRIGGER trg_messages_update_conversation
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Helper: user is participant
CREATE OR REPLACE FUNCTION is_conversation_participant(conv_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conv_id AND user_id = uid
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

DROP POLICY IF EXISTS conversations_select ON conversations;
CREATE POLICY conversations_select ON conversations
  FOR SELECT USING (is_conversation_participant(id, auth.uid()));

DROP POLICY IF EXISTS conversations_insert ON conversations;
CREATE POLICY conversations_insert ON conversations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS conversation_participants_select ON conversation_participants;
CREATE POLICY conversation_participants_select ON conversation_participants
  FOR SELECT USING (is_conversation_participant(conversation_id, auth.uid()));

DROP POLICY IF EXISTS conversation_participants_insert ON conversation_participants;
CREATE POLICY conversation_participants_insert ON conversation_participants
  FOR INSERT WITH CHECK (user_id = auth.uid() OR true);

DROP POLICY IF EXISTS conversation_participants_update ON conversation_participants;
CREATE POLICY conversation_participants_update ON conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS messages_select ON messages;
CREATE POLICY messages_select ON messages
  FOR SELECT USING (is_conversation_participant(conversation_id, auth.uid()));

DROP POLICY IF EXISTS messages_insert ON messages;
CREATE POLICY messages_insert ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND is_conversation_participant(conversation_id, auth.uid())
  );

DROP POLICY IF EXISTS message_read_receipts_select ON message_read_receipts;
CREATE POLICY message_read_receipts_select ON message_read_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_id
        AND is_conversation_participant(m.conversation_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS message_read_receipts_insert ON message_read_receipts;
CREATE POLICY message_read_receipts_insert ON message_read_receipts
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS message_read_receipts_update ON message_read_receipts;
CREATE POLICY message_read_receipts_update ON message_read_receipts
  FOR UPDATE USING (user_id = auth.uid());

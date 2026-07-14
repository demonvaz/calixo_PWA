-- Migración: Sistema de grupos (estilo WhatsApp)

-- =============================================================================
-- ENUMS
-- =============================================================================
DO $$ BEGIN
  CREATE TYPE group_member_role AS ENUM ('admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE group_invitation_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- GROUPS (chat_groups para evitar conflicto con palabra reservada)
-- =============================================================================
CREATE TABLE IF NOT EXISTS chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  description TEXT,
  avatar_path TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_groups_created_by ON chat_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_groups_updated_at ON chat_groups(updated_at DESC);

-- =============================================================================
-- GROUP MEMBERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS group_members (
  group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role group_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- =============================================================================
-- GROUP INVITATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status group_invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_group_invitations_invitee ON group_invitations(invitee_id, status);

-- =============================================================================
-- GROUP MESSAGES
-- =============================================================================
CREATE TABLE IF NOT EXISTS group_messages (
  id BIGSERIAL PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT group_messages_content_or_image CHECK (content <> '' OR image_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_group_messages_group_created ON group_messages(group_id, created_at DESC);

-- =============================================================================
-- GROUP MESSAGE READS
-- =============================================================================
CREATE TABLE IF NOT EXISTS group_message_reads (
  group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_message_id BIGINT,
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (group_id, user_id)
);

-- =============================================================================
-- TRIGGER: update chat_groups.updated_at on new message
-- =============================================================================
CREATE OR REPLACE FUNCTION update_group_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_groups SET updated_at = now() WHERE id = NEW.group_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_group_messages_update_group ON group_messages;
CREATE TRIGGER trg_group_messages_update_group
  AFTER INSERT ON group_messages
  FOR EACH ROW EXECUTE FUNCTION update_group_timestamp();

-- Auto-add creator as admin on group creation
CREATE OR REPLACE FUNCTION add_group_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_groups_add_creator ON chat_groups;
CREATE TRIGGER trg_chat_groups_add_creator
  AFTER INSERT ON chat_groups
  FOR EACH ROW EXECUTE FUNCTION add_group_creator_as_admin();

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_message_reads ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_group_member(gid UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members WHERE group_id = gid AND user_id = uid
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_group_admin(gid UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = gid AND user_id = uid AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

DROP POLICY IF EXISTS chat_groups_select ON chat_groups;
CREATE POLICY chat_groups_select ON chat_groups
  FOR SELECT USING (is_group_member(id, auth.uid()));

DROP POLICY IF EXISTS chat_groups_insert ON chat_groups;
CREATE POLICY chat_groups_insert ON chat_groups
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS chat_groups_update ON chat_groups;
CREATE POLICY chat_groups_update ON chat_groups
  FOR UPDATE USING (is_group_admin(id, auth.uid()));

DROP POLICY IF EXISTS group_members_select ON group_members;
CREATE POLICY group_members_select ON group_members
  FOR SELECT USING (is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS group_members_insert ON group_members;
CREATE POLICY group_members_insert ON group_members
  FOR INSERT WITH CHECK (is_group_admin(group_id, auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS group_members_delete ON group_members;
CREATE POLICY group_members_delete ON group_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR is_group_admin(group_id, auth.uid())
  );

DROP POLICY IF EXISTS group_invitations_select ON group_invitations;
CREATE POLICY group_invitations_select ON group_invitations
  FOR SELECT USING (invitee_id = auth.uid() OR is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS group_invitations_insert ON group_invitations;
CREATE POLICY group_invitations_insert ON group_invitations
  FOR INSERT WITH CHECK (is_group_member(group_id, auth.uid()) AND inviter_id = auth.uid());

DROP POLICY IF EXISTS group_invitations_update ON group_invitations;
CREATE POLICY group_invitations_update ON group_invitations
  FOR UPDATE USING (invitee_id = auth.uid());

DROP POLICY IF EXISTS group_messages_select ON group_messages;
CREATE POLICY group_messages_select ON group_messages
  FOR SELECT USING (is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS group_messages_insert ON group_messages;
CREATE POLICY group_messages_insert ON group_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND is_group_member(group_id, auth.uid())
  );

DROP POLICY IF EXISTS group_message_reads_select ON group_message_reads;
CREATE POLICY group_message_reads_select ON group_message_reads
  FOR SELECT USING (user_id = auth.uid() OR is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS group_message_reads_upsert ON group_message_reads;
CREATE POLICY group_message_reads_upsert ON group_message_reads
  FOR ALL USING (user_id = auth.uid());

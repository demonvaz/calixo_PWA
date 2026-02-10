-- Create feed_likes table for tracking likes on feed posts
-- This table allows users to like/unlike posts and prevents duplicate likes

CREATE TABLE IF NOT EXISTS feed_likes (
  id SERIAL PRIMARY KEY,
  feed_item_id INTEGER NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(feed_item_id, user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_feed_likes_feed_item_id ON feed_likes(feed_item_id);
CREATE INDEX IF NOT EXISTS idx_feed_likes_user_id ON feed_likes(user_id);

-- Add RLS policies
ALTER TABLE feed_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all likes
CREATE POLICY "Users can view all likes"
  ON feed_likes FOR SELECT
  USING (true);

-- Policy: Users can insert their own likes
CREATE POLICY "Users can insert their own likes"
  ON feed_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own likes
CREATE POLICY "Users can delete their own likes"
  ON feed_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Update feed_items to ensure likes_count column exists
-- (This should already exist, but adding for safety)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feed_items' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE feed_items ADD COLUMN likes_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create a function to update likes_count when likes are added/removed
CREATE OR REPLACE FUNCTION update_feed_item_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_items 
    SET likes_count = COALESCE(likes_count, 0) + 1 
    WHERE id = NEW.feed_item_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_items 
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) 
    WHERE id = OLD.feed_item_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update likes_count
DROP TRIGGER IF EXISTS trigger_update_likes_count_insert ON feed_likes;
CREATE TRIGGER trigger_update_likes_count_insert
  AFTER INSERT ON feed_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_item_likes_count();

DROP TRIGGER IF EXISTS trigger_update_likes_count_delete ON feed_likes;
CREATE TRIGGER trigger_update_likes_count_delete
  AFTER DELETE ON feed_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_item_likes_count();

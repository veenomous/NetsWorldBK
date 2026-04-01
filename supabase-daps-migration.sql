-- Comment Daps (upvotes) Migration
-- Run this in Supabase SQL Editor

-- Add daps column to comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS daps int NOT NULL DEFAULT 0;

-- Track who dapped what (prevent double daps)
CREATE TABLE IF NOT EXISTS comment_daps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, visitor_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_daps_comment ON comment_daps(comment_id);

ALTER TABLE comment_daps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read daps" ON comment_daps FOR SELECT USING (true);
CREATE POLICY "Anyone can dap" ON comment_daps FOR INSERT WITH CHECK (true);

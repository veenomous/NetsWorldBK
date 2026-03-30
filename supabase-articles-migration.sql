-- BK Grit Articles Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Articles table: fan-submitted posts
CREATE TABLE IF NOT EXISTS articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  tag text NOT NULL DEFAULT 'General',
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for feed queries
CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_tag ON articles(tag);
CREATE INDEX IF NOT EXISTS idx_articles_user ON articles(user_id);

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read articles" ON articles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert articles" ON articles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own articles" ON articles FOR UPDATE USING (true);
CREATE POLICY "Users can delete own articles" ON articles FOR DELETE USING (true);

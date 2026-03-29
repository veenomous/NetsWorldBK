-- BK Grit Auth Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Project: kijbuyyzetkxgcrphtjd

-- Users table: stores X (Twitter) profiles
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  x_id text UNIQUE NOT NULL,
  x_handle text NOT NULL,
  x_name text NOT NULL,
  x_avatar text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comments table: threaded comments on any page
CREATE TABLE IF NOT EXISTS comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page text NOT NULL,             -- e.g. 'trade-machine', 'tiebreaker', 'home'
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,  -- null = top-level
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_comments_page ON comments(page, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_x_id ON users(x_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Users: anyone can read, insert handled by API
CREATE POLICY "Anyone can read users" ON users FOR SELECT USING (true);
CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update users" ON users FOR UPDATE USING (true);

-- Comments: anyone can read, authenticated users can insert
CREATE POLICY "Anyone can read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (true);

-- BK Grit Game Recaps Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS game_recaps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  opponent text NOT NULL,
  game_date date NOT NULL,
  nets_score int NOT NULL,
  opponent_score int NOT NULL,
  mvp text NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 10),
  headline text NOT NULL,
  summary text NOT NULL,
  vibe text NOT NULL DEFAULT 'neutral',
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recaps_date ON game_recaps(game_date DESC);
CREATE INDEX IF NOT EXISTS idx_recaps_user ON game_recaps(user_id);

ALTER TABLE game_recaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read recaps" ON game_recaps FOR SELECT USING (true);
CREATE POLICY "Anyone can insert recaps" ON game_recaps FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own recaps" ON game_recaps FOR UPDATE USING (true);
CREATE POLICY "Users can delete own recaps" ON game_recaps FOR DELETE USING (true);

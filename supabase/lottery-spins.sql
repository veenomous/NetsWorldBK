-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS lottery_spins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id text NOT NULL,
  x_handle text,
  display_name text,
  nets_pick int NOT NULL CHECK (nets_pick BETWEEN 1 AND 14),
  top_4 boolean NOT NULL,
  original_slot int,
  spot_change int,
  spun_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lottery_spins_visitor
  ON lottery_spins(visitor_id, spun_at DESC);
CREATE INDEX IF NOT EXISTS idx_lottery_spins_best
  ON lottery_spins(nets_pick ASC, spun_at DESC);

ALTER TABLE lottery_spins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read spins" ON lottery_spins FOR SELECT USING (true);
CREATE POLICY "Anyone can insert spins" ON lottery_spins FOR INSERT WITH CHECK (true);

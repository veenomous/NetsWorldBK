-- BK Grit Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Hot Takes: fan-submitted opinions
CREATE TABLE hot_takes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  text text NOT NULL,
  author text NOT NULL DEFAULT 'Anonymous',
  tag text NOT NULL DEFAULT 'Hot Take',
  agrees int NOT NULL DEFAULT 0,
  disagrees int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  ip_hash text -- hashed IP for spam prevention
);

-- Take Votes: track who voted on what (prevent double voting)
CREATE TABLE take_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  take_id uuid REFERENCES hot_takes(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('agree', 'disagree')),
  visitor_id text NOT NULL, -- browser fingerprint or IP hash
  created_at timestamptz DEFAULT now(),
  UNIQUE(take_id, visitor_id)
);

-- Stock Votes: up/down votes on players
CREATE TABLE stock_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name text NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  visitor_id text NOT NULL,
  vote_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(player_name, visitor_id, vote_date) -- one vote per player per day
);

-- Prediction Picks: user picks for daily predictions
CREATE TABLE prediction_picks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id text NOT NULL,
  picked_option text NOT NULL,
  visitor_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(prediction_id, visitor_id)
);

-- Enable Row Level Security
ALTER TABLE hot_takes ENABLE ROW LEVEL SECURITY;
ALTER TABLE take_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_picks ENABLE ROW LEVEL SECURITY;

-- Policies: allow anonymous read and insert (no update/delete)
CREATE POLICY "Anyone can read takes" ON hot_takes FOR SELECT USING (true);
CREATE POLICY "Anyone can submit takes" ON hot_takes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update take counts" ON hot_takes FOR UPDATE USING (true);

CREATE POLICY "Anyone can read take_votes" ON take_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can vote on takes" ON take_votes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read stock_votes" ON stock_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can vote on stocks" ON stock_votes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read predictions" ON prediction_picks FOR SELECT USING (true);
CREATE POLICY "Anyone can make predictions" ON prediction_picks FOR INSERT WITH CHECK (true);

-- Seed some initial hot takes so the site isn't empty
INSERT INTO hot_takes (text, author, tag, agrees, disagrees) VALUES
('Cameron Boozer is the perfect pick for this team. We don''t need another guard.', 'BrooklynMike', 'Draft', 342, 87),
('We should trade this pick for an established star. Enough rebuilding.', 'NetsLifer', 'Hot Take', 156, 298),
('MPJ trade was a steal. 24 PPG and a future first? Denver got fleeced.', 'BKScouting', 'Roster', 421, 134),
('AJ Dybantsa at 3 would be the steal of the draft. 25 PPG as a freshman.', 'DraftNerd42', 'Draft', 267, 52),
('This front office has no plan. We''re just tanking with no vision.', 'BarclaysSad', 'Spicy', 198, 245),
('The Pacers being worse than us is actually bad. We need the #1 slot.', 'TankCommander', 'Strategy', 312, 88),
('Noah Clowney breakout year is the best thing about this season.', 'BKFuture', 'Roster', 289, 41),
('Egor Demin is going to be special. The vision is already there.', 'ScoutingBK', 'Roster', 234, 67);

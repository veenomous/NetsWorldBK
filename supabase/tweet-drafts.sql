-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS tweet_drafts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tweet_text text NOT NULL,
  article_title text,
  article_url text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'skipped')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tweet_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tweets" ON tweet_drafts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tweets" ON tweet_drafts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tweets" ON tweet_drafts FOR UPDATE USING (true);

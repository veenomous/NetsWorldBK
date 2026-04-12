-- Add article_slug column to hot_takes for linking Wire posts to wiki articles
-- Run in Supabase SQL Editor

ALTER TABLE hot_takes ADD COLUMN IF NOT EXISTS article_slug text;
ALTER TABLE hot_takes ADD COLUMN IF NOT EXISTS article_title text;

CREATE INDEX IF NOT EXISTS idx_hot_takes_article ON hot_takes(article_slug) WHERE article_slug IS NOT NULL;

-- Add image_url column to articles and game_recaps
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE game_recaps ADD COLUMN IF NOT EXISTS image_url text;

-- Create storage bucket for images (run in Supabase Dashboard > Storage > New Bucket)
-- Bucket name: images
-- Public: yes

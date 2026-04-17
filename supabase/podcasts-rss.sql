-- Adds RSS/audio ingestion support to podcast_episodes
-- Run in Supabase SQL Editor after supabase/podcasts.sql

alter table podcast_episodes
  add column if not exists source_type text default 'youtube' check (source_type in ('youtube', 'rss', 'upload'));

alter table podcast_episodes
  add column if not exists assemblyai_id text;

alter table podcast_episodes
  add column if not exists audio_url text;

create index if not exists podcast_episodes_assemblyai_id_idx on podcast_episodes (assemblyai_id) where assemblyai_id is not null;
create index if not exists podcast_episodes_source_type_idx on podcast_episodes (source_type);

-- Allow 'transcribing' status for RSS/upload flows where AssemblyAI is async
alter table podcast_episodes drop constraint if exists podcast_episodes_status_check;
alter table podcast_episodes add constraint podcast_episodes_status_check
  check (status in ('processing', 'transcribing', 'ready', 'error'));

-- Store RSS feed URL + hosting info on the show
alter table podcasts add column if not exists author text;

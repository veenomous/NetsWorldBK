-- Run in Supabase SQL Editor

create table if not exists podcasts (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  name text not null,
  channel_id text,
  channel_url text,
  host_name text,
  description text,
  thumbnail_url text,
  website_url text,
  rss_url text,
  created_at timestamptz default now()
);

create table if not exists podcast_episodes (
  id uuid default gen_random_uuid() primary key,
  podcast_id uuid references podcasts(id) on delete cascade,
  slug text not null,
  youtube_id text unique,
  source_url text not null,
  title text not null,
  description text,
  thumbnail_url text,
  duration_seconds int,
  published_at timestamptz,
  transcript jsonb,
  summary text,
  hot_moments jsonb,
  chapters jsonb,
  tweet_thread text,
  show_notes text,
  wiki_links jsonb,
  status text default 'processing' check (status in ('processing', 'ready', 'error')),
  error_message text,
  created_at timestamptz default now(),
  unique (podcast_id, slug)
);

create index if not exists podcast_episodes_podcast_id_idx on podcast_episodes (podcast_id);
create index if not exists podcast_episodes_status_idx on podcast_episodes (status);
create index if not exists podcast_episodes_published_at_idx on podcast_episodes (published_at desc);

alter table podcasts enable row level security;
create policy "Anyone can read podcasts" on podcasts for select using (true);
create policy "Anyone can insert podcasts" on podcasts for insert with check (true);
create policy "Anyone can update podcasts" on podcasts for update using (true);

alter table podcast_episodes enable row level security;
create policy "Anyone can read episodes" on podcast_episodes for select using (true);
create policy "Anyone can insert episodes" on podcast_episodes for insert with check (true);
create policy "Anyone can update episodes" on podcast_episodes for update using (true);

-- Link podcast episodes to Wire takes (attribution + click-back to episode)
alter table hot_takes add column if not exists podcast_episode_id uuid references podcast_episodes(id) on delete set null;
alter table hot_takes add column if not exists podcast_timestamp_ms int;
create index if not exists hot_takes_podcast_episode_id_idx on hot_takes (podcast_episode_id);

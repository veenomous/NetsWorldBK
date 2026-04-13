-- Run in Supabase SQL Editor

create table if not exists spaces (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  opponent text,
  date text not null,
  duration_mins int,
  audio_url text not null,
  summary text,
  status text default 'processing' check (status in ('processing', 'transcribed', 'ready', 'error')),
  transcript jsonb,
  hot_moments jsonb,
  speaker_count int default 0,
  created_at timestamptz default now()
);

create table if not exists space_speakers (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references spaces(id),
  speaker_label text not null,
  x_handle text,
  claimed_at timestamptz
);

alter table spaces enable row level security;
create policy "Anyone can read spaces" on spaces for select using (true);
create policy "Authenticated can insert" on spaces for insert with check (true);
create policy "Anyone can update" on spaces for update using (true);

alter table space_speakers enable row level security;
create policy "Anyone can read speakers" on space_speakers for select using (true);
create policy "Anyone can claim" on space_speakers for insert with check (true);
create policy "Anyone can update speakers" on space_speakers for update using (true);

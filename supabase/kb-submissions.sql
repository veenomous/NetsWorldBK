-- Run this in the Supabase SQL Editor to create the KB submissions table
-- Dashboard → SQL Editor → New Query → paste this → Run

create table if not exists kb_submissions (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  note text,
  source_type text default 'article',
  submitted_by text default 'anonymous',
  visitor_id text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  upvotes int default 0,
  created_at timestamptz default now()
);

-- Allow public inserts (for anonymous submissions)
alter table kb_submissions enable row level security;

create policy "Anyone can submit" on kb_submissions
  for insert with check (true);

create policy "Anyone can read" on kb_submissions
  for select using (true);

create policy "Anyone can upvote" on kb_submissions
  for update using (true) with check (true);

-- Index for sorting
create index idx_kb_submissions_status on kb_submissions(status, created_at desc);
create index idx_kb_submissions_upvotes on kb_submissions(upvotes desc);

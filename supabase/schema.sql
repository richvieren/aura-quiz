create table quiz_responses (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  answers jsonb not null,
  scores jsonb not null,
  result_type text not null check (result_type in ('apex', 'axon', 'aeon', 'aura')),
  diagnosis jsonb,
  paid boolean default false,
  pillar_tag text not null,
  stripe_session_id text,
  created_at timestamptz default now()
);

-- RLS: allow inserts from anon (quiz submission)
alter table quiz_responses enable row level security;

create policy "Allow anon insert"
  on quiz_responses for insert
  to anon
  with check (true);

create policy "Allow anon select by id"
  on quiz_responses for select
  to anon
  using (true);

-- Edge functions will use service role key (bypasses RLS)

-- V2 migration (2026-03-29)
alter table quiz_responses
  add column if not exists context_tags jsonb;

alter table quiz_responses
  rename column diagnosis to gameplan;

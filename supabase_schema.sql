-- ============================================================
-- PULSE APP — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. PROFILES (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  name text not null,
  bio text default 'Hey, I''m on Pulse! 👋',
  color text default '#A78BFA',
  online boolean default false,
  last_seen timestamptz default now(),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);


-- 2. FRIEND REQUESTS
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_id uuid references public.profiles(id) on delete cascade not null,
  to_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(from_id, to_id)
);
alter table public.friend_requests enable row level security;

create policy "Users can see requests involving them"
  on public.friend_requests for select
  using (auth.uid() = from_id or auth.uid() = to_id);

create policy "Users can send friend requests"
  on public.friend_requests for insert
  with check (auth.uid() = from_id);

create policy "Users can delete requests involving them"
  on public.friend_requests for delete
  using (auth.uid() = from_id or auth.uid() = to_id);


-- 3. FRIENDSHIPS
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references public.profiles(id) on delete cascade not null,
  user_b uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_a, user_b)
);
alter table public.friendships enable row level security;

create policy "Users can see their own friendships"
  on public.friendships for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "Users can insert friendships"
  on public.friendships for insert
  with check (auth.uid() = user_a or auth.uid() = user_b);

create policy "Users can delete their friendships"
  on public.friendships for delete
  using (auth.uid() = user_a or auth.uid() = user_b);


-- 4. MESSAGES
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  from_id uuid references public.profiles(id) on delete cascade not null,
  to_id uuid references public.profiles(id) on delete cascade not null,
  text text,
  type text default 'text', -- 'text' | 'image' | 'file'
  data_url text,            -- base64 for images/files
  file_size text,
  seen boolean default false,
  created_at timestamptz default now()
);
alter table public.messages enable row level security;

create policy "Users can see their own messages"
  on public.messages for select
  using (auth.uid() = from_id or auth.uid() = to_id);

create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = from_id);

create policy "Recipients can mark messages as seen"
  on public.messages for update
  using (auth.uid() = to_id);


-- 5. TYPING INDICATORS
create table if not exists public.typing (
  from_id uuid references public.profiles(id) on delete cascade not null,
  to_id uuid references public.profiles(id) on delete cascade not null,
  updated_at timestamptz default now(),
  primary key (from_id, to_id)
);
alter table public.typing enable row level security;

create policy "Anyone can see typing indicators"
  on public.typing for select using (true);

create policy "Users can upsert their own typing"
  on public.typing for insert with check (auth.uid() = from_id);

create policy "Users can update their own typing"
  on public.typing for update using (auth.uid() = from_id);


-- 6. Enable Realtime on messages and typing
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.typing;
alter publication supabase_realtime add table public.profiles;

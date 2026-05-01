-- 1. Profiles Table (Extends Auth.Users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  department text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Board Posts Table
create table posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text,
  author_id uuid references profiles(id) on delete cascade not null,
  is_important boolean default false,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Administrative Documents Table
create table documents (
  id uuid default gen_random_uuid() primary key,
  file_name text not null,
  file_path text not null,
  file_size bigint,
  category text,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security)
alter table profiles enable row level security;
alter table posts enable row level security;
alter table documents enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

create policy "Posts are viewable by everyone." on posts for select using (true);
create policy "Authenticated users can create posts." on posts for insert with check (auth.role() = 'authenticated');

create policy "Documents are viewable by everyone." on documents for select using (true);

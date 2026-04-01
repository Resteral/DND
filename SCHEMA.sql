-- ARCANE VTT 3D - SUPABASE DATABASE SCHEMA
-- Execute this in your Supabase SQL Editor to enable all persistence features.

-- 1. DUNGEONS TABLE
-- Stores entire saved session states (room type, all characters, all props)
create table if not exists dungeons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  config jsonb not null, -- Stores the JSON representation of your VTT room
  created_at timestamp with time zone default now()
);

-- 2. CHARACTERS TABLE (Optional - for persistent character vault)
-- Allows players to save their Forge creations independently
create table if not exists characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  name text not null,
  class text not null,
  stats jsonb not null,
  color text,
  model_url text, -- Store Meshy GLB links here
  created_at timestamp with time zone default now()
);

-- 3. ENABLE REALTIME
-- To sync token movement and dice rolls across all grouped players
-- IMPORTANT: Go to Supabase > Database > Replication and enable 'Realtime' for these tables.
alter publication supabase_realtime add table dungeons;

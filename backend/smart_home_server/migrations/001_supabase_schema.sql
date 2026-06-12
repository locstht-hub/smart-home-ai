-- Smart Home AI - Supabase/Postgres schema
-- Run this file in Supabase SQL Editor before switching the Flask backend
-- from SQLite to Postgres.

begin;

create table if not exists public.users (
  id text primary key,
  username text not null,
  phone text,
  name text not null,
  password_hash text not null,
  role text not null check (role in ('system_admin', 'owner', 'member', 'viewer')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  last_active timestamptz
);

create unique index if not exists users_username_unique_idx
  on public.users (username);

create unique index if not exists users_username_lower_unique_idx
  on public.users (lower(username));

create unique index if not exists users_phone_unique_idx
  on public.users (phone)
  where phone is not null;

create table if not exists public.homes (
  id text primary key,
  name text not null,
  owner_id text not null references public.users(id),
  status text not null default 'active' check (status in ('active', 'suspended')),
  energy_limit_kwh double precision not null default 2500.0,
  created_at timestamptz not null default now()
);

create index if not exists homes_owner_id_idx
  on public.homes (owner_id);

create index if not exists homes_status_created_at_idx
  on public.homes (status, created_at);

create table if not exists public.home_members (
  id text primary key,
  home_id text not null references public.homes(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  role_in_home text not null check (role_in_home in ('owner', 'member', 'viewer')),
  can_manage_members boolean not null default false,
  can_manage_devices boolean not null default false,
  created_at timestamptz not null default now(),
  unique (home_id, user_id)
);

create index if not exists home_members_home_id_idx
  on public.home_members (home_id);

create index if not exists home_members_user_id_idx
  on public.home_members (user_id);

create table if not exists public.sessions (
  token text primary key,
  user_id text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists sessions_user_id_idx
  on public.sessions (user_id);

create index if not exists sessions_expires_at_idx
  on public.sessions (expires_at);

create table if not exists public.audit_logs (
  id text primary key,
  actor_user_id text,
  actor_username text,
  actor_role text,
  action text not null,
  target_type text,
  target_id text,
  target_name text,
  home_id text,
  ip_address text,
  user_agent text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at
  on public.audit_logs (created_at desc);

create index if not exists idx_audit_logs_actor
  on public.audit_logs (actor_user_id);

create index if not exists idx_audit_logs_home
  on public.audit_logs (home_id);

create index if not exists idx_audit_logs_action_created_at
  on public.audit_logs (action, created_at desc);

create table if not exists public.power_readings (
  id text primary key,
  home_id text not null references public.homes(id) on delete cascade,
  timestamp timestamptz not null,
  voltage double precision,
  current double precision,
  power_kw double precision,
  energy_kwh double precision,
  source text not null default 'unknown',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_power_readings_home_time
  on public.power_readings (home_id, timestamp desc);

create index if not exists idx_power_readings_source_time
  on public.power_readings (source, timestamp desc);

create index if not exists idx_power_readings_home_created_at
  on public.power_readings (home_id, created_at desc);

comment on table public.users is 'Application users managed by Smart Home AI backend. This is separate from Supabase auth.users.';
comment on table public.homes is 'Smart homes managed by owner/member roles.';
comment on table public.home_members is 'Membership and in-home permissions.';
comment on table public.sessions is 'Backend-issued session tokens. Keep this only while Flask auth remains active.';
comment on table public.audit_logs is 'Important actions for admin/member activity review.';
comment on table public.power_readings is 'Power telemetry from PLC/MFM384 or collector, scoped by home.';

commit;


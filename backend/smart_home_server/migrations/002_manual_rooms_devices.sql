-- Smart Home AI - Manual room/device inventory schema
-- Run after 001_supabase_schema.sql.
-- This supports prototype/level-1 management: users manually create rooms
-- and devices, then assign rated power and optional PLC tags.

begin;

create table if not exists public.rooms (
  id text primary key,
  home_id text not null references public.homes(id) on delete cascade,
  name text not null,
  type text not null default 'room',
  sort_order integer not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rooms_home_sort
  on public.rooms (home_id, sort_order, name);

create unique index if not exists rooms_home_name_lower_unique_idx
  on public.rooms (home_id, lower(name));

create table if not exists public.devices (
  id text primary key,
  home_id text not null references public.homes(id) on delete cascade,
  room_id text references public.rooms(id) on delete set null,
  name text not null,
  type text not null default 'other'
    check (type in ('light', 'fan', 'aircon', 'socket', 'sensor', 'appliance', 'other')),
  status text not null default 'unknown'
    check (status in ('on', 'off', 'offline', 'unknown')),
  rated_power_w double precision not null default 0.0 check (rated_power_w >= 0),
  is_controllable boolean not null default true,
  plc_status_tag text,
  plc_on_command_tag text,
  plc_off_command_tag text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_devices_home_room
  on public.devices (home_id, room_id);

create index if not exists idx_devices_home_type
  on public.devices (home_id, type);

create index if not exists idx_devices_status
  on public.devices (status);

create unique index if not exists devices_home_name_lower_unique_idx
  on public.devices (home_id, lower(name));

create table if not exists public.device_events (
  id text primary key,
  home_id text not null references public.homes(id) on delete cascade,
  room_id text references public.rooms(id) on delete set null,
  device_id text references public.devices(id) on delete set null,
  actor_user_id text references public.users(id) on delete set null,
  event_type text not null
    check (event_type in ('created', 'updated', 'deleted', 'turned_on', 'turned_off', 'status_sync', 'manual_note')),
  source text not null default 'manual',
  value_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_device_events_home_time
  on public.device_events (home_id, created_at desc);

create index if not exists idx_device_events_device_time
  on public.device_events (device_id, created_at desc);

create index if not exists idx_device_events_type_time
  on public.device_events (event_type, created_at desc);

comment on table public.rooms is 'Manual room inventory per smart home.';
comment on table public.devices is 'Manual device inventory per home/room with rated power and optional PLC mapping.';
comment on table public.device_events is 'Device inventory/control event history for audit and thesis analysis.';
comment on column public.devices.rated_power_w is 'Manual rated power in watts; not a per-device measured value unless mapped later.';

commit;

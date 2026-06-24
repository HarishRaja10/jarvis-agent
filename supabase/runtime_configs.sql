create table if not exists public.runtime_configs (
  config_id text primary key,
  config jsonb not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.runtime_configs to service_role;

alter table public.runtime_configs enable row level security;

create or replace function public.set_runtime_configs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists runtime_configs_updated_at on public.runtime_configs;
create trigger runtime_configs_updated_at
before update on public.runtime_configs
for each row
execute function public.set_runtime_configs_updated_at();

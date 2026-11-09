-- VIRA — Fase 1: perfis, maioridade e privacidade.
-- Esta migration é aplicada ao projeto Supabase do usuário, não substitui o banco por armazenamento local.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  date_of_birth date not null,
  city text not null default '' check (char_length(city) <= 80),
  state text not null default '' check (state = '' or state ~ '^[A-Z]{2}$'),
  bio text not null default '' check (char_length(bio) <= 300),
  interests text[] not null default '{}',
  intentions text[] not null default '{}',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_interests_allowed check (
    interests <@ array['Futebol', 'Música', 'Cinema', 'Games', 'Tecnologia', 'Viagens', 'Gastronomia', 'Pets', 'Atividades físicas', 'Leitura', 'Fotografia', 'Natureza']::text[]
  ),
  constraint profiles_intentions_allowed check (
    intentions <@ array['friendship', 'relationship', 'outings', 'communities']::text[]
  ),
  constraint profiles_onboarding_complete check (
    not onboarding_completed or (char_length(city) >= 1 and state ~ '^[A-Z]{2}$' and cardinality(intentions) >= 1)
  )
);

comment on column public.profiles.date_of_birth is 'Dado privado usado para validar 18+ e derivar idade; nunca exibido diretamente.';
comment on column public.profiles.city is 'Cidade informada pelo usuário; não representa localização exata.';
comment on column public.profiles.state is 'UF brasileira de duas letras; não representa localização exata.';

create or replace function public.enforce_adult_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.date_of_birth is null or new.date_of_birth > (current_date - interval '18 years')::date then
    raise exception using
      errcode = 'check_violation',
      message = 'A VIRA está disponível apenas para pessoas com 18 anos ou mais.';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_adult_profile() from public, anon, authenticated;

drop trigger if exists profiles_require_adult on public.profiles;
create trigger profiles_require_adult
before insert or update of date_of_birth on public.profiles
for each row execute function public.enforce_adult_profile();

create or replace function public.create_profile_for_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  birth_date_text text;
  birth_date_value date;
  profile_name text;
begin
  birth_date_text := new.raw_user_meta_data ->> 'date_of_birth';
  profile_name := nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '');
  if birth_date_text is null or profile_name is null then
    raise exception using errcode = 'check_violation', message = 'Nome e data de nascimento são obrigatórios.';
  end if;
  begin
    birth_date_value := birth_date_text::date;
  exception when invalid_text_representation or datetime_field_overflow then
    raise exception using errcode = 'check_violation', message = 'Data de nascimento inválida.';
  end;
  if char_length(profile_name) < 2 or char_length(profile_name) > 40 then
    raise exception using errcode = 'check_violation', message = 'O nome deve ter entre 2 e 40 caracteres.';
  end if;

  insert into public.profiles (id, display_name, date_of_birth)
  values (new.id, profile_name, birth_date_value)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.create_profile_for_new_auth_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.create_profile_for_new_auth_user();

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_profile_updated_at() from public, anon, authenticated;
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_profile_updated_at();

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name, city, state, bio, interests, intentions, onboarding_completed) on table public.profiles to authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

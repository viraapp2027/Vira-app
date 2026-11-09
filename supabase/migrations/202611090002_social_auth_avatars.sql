-- VIRA — extensão OAuth social e foto de perfil.
-- Perfis sociais podem existir incompletos, mas não podem concluir o onboarding sem comprovar 18+.

alter table public.profiles
  alter column date_of_birth drop not null,
  add column if not exists avatar_path text;

comment on column public.profiles.avatar_path is 'Caminho do objeto privado de foto de perfil no bucket vira-avatars; acessível nesta fase apenas pelo próprio usuário.';

alter table public.profiles
  drop constraint if exists profiles_onboarding_complete;

alter table public.profiles
  add constraint profiles_onboarding_complete check (
    not onboarding_completed
    or (
      date_of_birth is not null
      and date_of_birth <= (current_date - interval '18 years')::date
      and char_length(city) >= 1
      and state ~ '^[A-Z]{2}$'
      and cardinality(intentions) >= 1
    )
  );

create or replace function public.enforce_adult_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.onboarding_completed and new.date_of_birth is null then
    raise exception using
      errcode = 'check_violation',
      message = 'Informe sua data de nascimento para concluir o cadastro.';
  end if;

  if new.date_of_birth is not null
    and new.date_of_birth > (current_date - interval '18 years')::date then
    raise exception using
      errcode = 'check_violation',
      message = 'A VIRA está disponível apenas para pessoas com 18 anos ou mais.';
  end if;

  if tg_op = 'UPDATE' and old.onboarding_completed
    and new.date_of_birth is distinct from old.date_of_birth then
    raise exception using
      errcode = 'check_violation',
      message = 'A data de nascimento não pode ser alterada após a conclusão do cadastro.';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_require_adult on public.profiles;
create trigger profiles_require_adult
before insert or update on public.profiles
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

  profile_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(split_part(coalesce(new.email, ''), '@', 1)), '')
  );
  if profile_name is null or char_length(profile_name) < 2 then
    profile_name := 'Pessoa VIRA';
  end if;
  profile_name := left(profile_name, 40);
  if char_length(profile_name) < 2 then
    profile_name := 'Pessoa VIRA';
  end if;

  if birth_date_text is not null then
    begin
      birth_date_value := birth_date_text::date;
    exception when invalid_text_representation or datetime_field_overflow then
      raise exception using
        errcode = 'check_violation',
        message = 'Data de nascimento inválida.';
    end;
  else
    birth_date_value := null;
  end if;

  insert into public.profiles (id, display_name, date_of_birth)
  values (new.id, profile_name, birth_date_value)
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.create_profile_for_new_auth_user() is 'Cria perfil após Supabase Auth; contas sociais sem nascimento ficam incompletas até onboarding adulto.';

-- Permitir que o dono informe o nascimento somente enquanto o onboarding não estiver concluído.
grant update (date_of_birth, avatar_path) on table public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vira-avatars',
  'vira-avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[];

drop policy if exists vira_avatars_select_own on storage.objects;
create policy vira_avatars_select_own
on storage.objects for select
to authenticated
using (
  bucket_id = 'vira-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists vira_avatars_insert_own on storage.objects;
create policy vira_avatars_insert_own
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'vira-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists vira_avatars_update_own on storage.objects;
create policy vira_avatars_update_own
on storage.objects for update
to authenticated
using (
  bucket_id = 'vira-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'vira-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists vira_avatars_delete_own on storage.objects;
create policy vira_avatars_delete_own
on storage.objects for delete
to authenticated
using (
  bucket_id = 'vira-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

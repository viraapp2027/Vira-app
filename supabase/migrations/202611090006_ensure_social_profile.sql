-- VIRA — recuperar perfis sociais criados antes do trigger de profiles.
-- A função é idempotente e só pode atuar sobre a sessão autenticada atual.
create or replace function public.ensure_my_profile()
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  auth_user auth.users%rowtype;
  profile_row public.profiles%rowtype;
  profile_name text;
begin
  select * into auth_user
  from auth.users
  where id = auth.uid();

  if not found then
    raise exception using errcode = 'insufficient_privilege', message = 'Sessão não encontrada.';
  end if;

  select * into profile_row
  from public.profiles
  where id = auth_user.id;

  if found then
    return profile_row;
  end if;

  profile_name := coalesce(
    nullif(btrim(auth_user.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(auth_user.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(split_part(coalesce(auth_user.email, ''), '@', 1)), '')
  );
  if profile_name is null or char_length(profile_name) < 2 then
    profile_name := 'Pessoa VIRA';
  end if;
  profile_name := left(profile_name, 40);

  insert into public.profiles (id, display_name, date_of_birth, adult_attested)
  values (auth_user.id, profile_name, null, false)
  on conflict (id) do nothing;

  select * into profile_row
  from public.profiles
  where id = auth_user.id;
  return profile_row;
end;
$$;

revoke all on function public.ensure_my_profile() from public, anon;
grant execute on function public.ensure_my_profile() to authenticated;

-- VIRA — registra autodeclaração de 18+ sem afirmar verificação independente.
-- Perfis já concluídos mantêm todos os dados; quem ainda não tem registro será convidado a confirmar na próxima entrada.

alter table public.profiles
  add column if not exists adult_attested boolean not null default false,
  add column if not exists adult_attested_at timestamptz,
  add column if not exists adult_attestation_version text;

comment on column public.profiles.adult_attested is 'Autodeclaração do usuário de que tem 18 anos ou mais; não representa verificação independente de identidade/idade.';
comment on column public.profiles.adult_attested_at is 'Horário definido pelo banco quando a pessoa conclui onboarding com autodeclaração afirmativa.';
comment on column public.profiles.adult_attestation_version is 'Versão do texto de autodeclaração aceito.';

grant update (adult_attested) on table public.profiles to authenticated;

alter table public.profiles
  drop constraint if exists profiles_age_attestation_fields_consistent;

alter table public.profiles
  add constraint profiles_age_attestation_fields_consistent check (
    (adult_attested_at is null) = (adult_attestation_version is null)
    and (adult_attested_at is null or adult_attested)
  );

create or replace function public.enforce_adult_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.onboarding_completed then
    if not new.onboarding_completed then
      raise exception using errcode = 'check_violation', message = 'O onboarding não pode ser reaberto após a conclusão.';
    end if;
    if new.date_of_birth is distinct from old.date_of_birth then
      raise exception using errcode = 'check_violation', message = 'A data de nascimento não pode ser alterada após a conclusão do cadastro.';
    end if;
    if old.adult_attested and (
      not new.adult_attested
      or new.adult_attested_at is distinct from old.adult_attested_at
      or new.adult_attestation_version is distinct from old.adult_attestation_version
    ) then
      raise exception using errcode = 'check_violation', message = 'A autodeclaração registrada não pode ser removida ou alterada.';
    end if;
    if not old.adult_attested and not new.adult_attested then
      raise exception using errcode = 'check_violation', message = 'Confirme sua autodeclaração de 18 anos ou mais para continuar.';
    end if;
  end if;

  if new.date_of_birth is not null
    and new.date_of_birth > (current_date - interval '18 years')::date then
    raise exception using errcode = 'check_violation', message = 'A data informada precisa indicar 18 anos ou mais.';
  end if;

  if new.onboarding_completed then
    if new.date_of_birth is null then
      raise exception using errcode = 'check_violation', message = 'Informe sua data de nascimento para concluir o cadastro.';
    end if;
    if not new.adult_attested then
      raise exception using errcode = 'check_violation', message = 'Confirme sua autodeclaração de 18 anos ou mais para concluir.';
    end if;
    if new.adult_attested_at is null then
      new.adult_attested_at := timezone('utc', now());
      new.adult_attestation_version := 'adult-self-declaration-v1';
    end if;
  elsif not new.adult_attested then
    new.adult_attested_at := null;
    new.adult_attestation_version := null;
  end if;

  return new;
end;
$$;

comment on function public.enforce_adult_profile() is 'Exige data informada de 18+ e autodeclaração registrada para concluir; não é verificação independente de idade.';

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
  adult_attested_value boolean := false;
  auth_provider text;
begin
  auth_provider := coalesce(new.raw_app_meta_data ->> 'provider', '');
  if auth_provider = 'email' then
    birth_date_text := new.raw_user_meta_data ->> 'date_of_birth';
    adult_attested_value := lower(coalesce(new.raw_user_meta_data ->> 'adult_attested', 'false')) = 'true';
  end if;

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

  if birth_date_text is not null then
    begin
      birth_date_value := birth_date_text::date;
    exception when invalid_text_representation or datetime_field_overflow then
      raise exception using errcode = 'check_violation', message = 'Data de nascimento inválida.';
    end;
  end if;

  insert into public.profiles (id, display_name, date_of_birth, adult_attested)
  values (new.id, profile_name, birth_date_value, adult_attested_value)
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.create_profile_for_new_auth_user() is 'Cria perfil mínimo; aceita a declaração inicial somente no cadastro de e-mail, nunca em metadata de Google/Facebook.';

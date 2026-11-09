-- VIRA — registrar a autodeclaração pelo banco quando ela é aceita.
-- Conta de e-mail envia adult_attested no cadastro; OAuth e perfis antigos registram no onboarding.

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
  end if;

  if new.adult_attested then
    if new.adult_attested_at is null then
      new.adult_attested_at := now();
      new.adult_attestation_version := 'adult-self-declaration-v1';
    end if;
  else
    new.adult_attested_at := null;
    new.adult_attestation_version := null;
  end if;

  return new;
end;
$$;

comment on function public.enforce_adult_profile() is 'Exige data informada de 18+ e autodeclaração; grava timestamp/versão no banco, sem verificar identidade ou idade real.';

-- A data de nascimento e o estado de conclusão ficam imutáveis após o onboarding adulto.
create or replace function public.enforce_adult_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.onboarding_completed then
    if not new.onboarding_completed then
      raise exception using
        errcode = 'check_violation',
        message = 'O onboarding não pode ser reaberto após a conclusão.';
    end if;

    if new.date_of_birth is distinct from old.date_of_birth then
      raise exception using
        errcode = 'check_violation',
        message = 'A data de nascimento não pode ser alterada após a conclusão do cadastro.';
    end if;
  end if;

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

  return new;
end;
$$;

comment on function public.enforce_adult_profile() is 'Exige 18 anos para concluir o onboarding e torna a data/estado imutáveis após conclusão.';

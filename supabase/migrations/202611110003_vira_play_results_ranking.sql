-- VIRA Play — resultados agregados e ranking de participação.
-- Perguntas opinativas não possuem gabarito; o ranking mede conclusão/respostas.

create unique index if not exists challenge_questions_id_challenge_id_uidx
  on public.challenge_questions (id, challenge_id);

alter table public.challenge_responses
  drop constraint if exists challenge_responses_question_challenge_fkey;
alter table public.challenge_responses
  add constraint challenge_responses_question_challenge_fkey
  foreign key (question_id, challenge_id)
  references public.challenge_questions (id, challenge_id)
  on delete cascade;

alter table public.challenge_responses
  drop constraint if exists challenge_responses_answer_string_check;
alter table public.challenge_responses
  add constraint challenge_responses_answer_string_check
  check (jsonb_typeof(answer) = 'string');

revoke select on table public.challenge_responses from authenticated, anon;

drop policy if exists challenge_participants_insert_self on public.challenge_participants;
create policy challenge_participants_insert_self
on public.challenge_participants for insert
to authenticated
with check (
  (select auth.uid()) = participant_id
  and exists (
    select 1 from public.challenges c
    where c.id = challenge_id and c.status = 'published'
  )
);

drop policy if exists challenge_responses_insert_own on public.challenge_responses;
create policy challenge_responses_insert_own
on public.challenge_responses for insert
to authenticated
with check (
  (select auth.uid()) = participant_id
  and exists (
    select 1 from public.challenge_participants p
    where p.challenge_id = challenge_id and p.participant_id = (select auth.uid())
  )
  and exists (
    select 1 from public.challenges c
    where c.id = challenge_id and c.status = 'published'
  )
);

drop policy if exists challenge_responses_update_own on public.challenge_responses;
create policy challenge_responses_update_own
on public.challenge_responses for update
to authenticated
using (
  (select auth.uid()) = participant_id
  and exists (
    select 1 from public.challenges c
    where c.id = challenge_id and c.status = 'published'
  )
)
with check (
  (select auth.uid()) = participant_id
  and exists (
    select 1 from public.challenge_questions q
    where q.id = question_id and q.challenge_id = challenge_id
  )
);

create or replace function public.submit_challenge_answers(
  p_share_token text,
  p_answers jsonb
)
returns table (challenge_id uuid, answered_count integer, total_questions integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  challenge_row public.challenges%rowtype;
  expected_count integer;
  answer_count integer;
  invalid_count integer;
begin
  if (auth.uid() is null) then
    raise exception using errcode = '42501', message = 'É necessário entrar para participar.';
  end if;
  if jsonb_typeof(p_answers) <> 'object' then
    raise exception using errcode = '22023', message = 'Respostas inválidas.';
  end if;

  select c.* into challenge_row
  from public.challenges c
  where c.share_token = p_share_token and c.status = 'published';
  if not found then
    raise exception using errcode = 'P0002', message = 'Desafio não encontrado.';
  end if;

  select count(*)::integer into expected_count
  from public.challenge_questions q where q.challenge_id = challenge_row.id;
  select count(*)::integer into answer_count from jsonb_object_keys(p_answers);
  if answer_count <> expected_count then
    raise exception using errcode = '22023', message = 'Responda todas as perguntas.';
  end if;

  select count(*)::integer into invalid_count
  from jsonb_each_text(p_answers) a
  where not exists (
    select 1 from public.challenge_questions q
    where q.id = a.key::uuid
      and q.challenge_id = challenge_row.id
      and exists (select 1 from jsonb_array_elements_text(q.options) option_value where option_value = a.value)
  );
  if invalid_count > 0 then
    raise exception using errcode = '22023', message = 'Uma ou mais respostas são inválidas.';
  end if;

  insert into public.challenge_participants (challenge_id, participant_id)
  values (challenge_row.id, auth.uid())
  on conflict (challenge_id, participant_id) do nothing;

  delete from public.challenge_responses
  where public.challenge_responses.challenge_id = challenge_row.id
    and public.challenge_responses.participant_id = auth.uid();

  insert into public.challenge_responses (challenge_id, question_id, participant_id, answer)
  select challenge_row.id, a.key::uuid, auth.uid(), to_jsonb(a.value)
  from jsonb_each_text(p_answers) a;

  return query select challenge_row.id, answer_count, expected_count;
end;
$$;

create or replace function public.get_challenge_ranking(
  p_share_token text,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  rank bigint,
  participant_id uuid,
  display_name text,
  answered_count bigint,
  total_questions bigint,
  completed_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  with target as (
    select c.id
    from public.challenges c
    where c.share_token = p_share_token and c.status = 'published'
  ), totals as (
    select count(*)::bigint as total_questions from public.challenge_questions q, target t where q.challenge_id = t.id
  ), scores as (
    select p.participant_id,
           count(r.id)::bigint as answered_count,
           max(r.created_at) as completed_at
    from public.challenge_participants p
    join target t on t.id = p.challenge_id
    left join public.challenge_responses r on r.challenge_id = p.challenge_id and r.participant_id = p.participant_id
    group by p.participant_id
  ), ordered as (
    select row_number() over (order by s.answered_count desc, s.completed_at asc nulls last, s.participant_id) as rank,
           s.participant_id, s.answered_count, s.completed_at
    from scores s
  )
  select o.rank, o.participant_id, coalesce(pr.display_name, 'Participante') as display_name,
         o.answered_count, t.total_questions, o.completed_at
  from ordered o
  cross join totals t
  left join public.profiles pr on pr.id = o.participant_id
  where p_limit between 1 and 100 and p_offset >= 0
  order by o.rank
  limit p_limit offset p_offset;
$$;

create or replace function public.get_challenge_results(p_challenge_id uuid)
returns table (
  question_id uuid,
  prompt text,
  option text,
  response_count bigint
)
language sql
security definer
set search_path = ''
as $$
  select q.id, q.prompt, option_value, count(r.id)::bigint
  from public.challenge_questions q
  join public.challenges c on c.id = q.challenge_id
  cross join lateral jsonb_array_elements_text(q.options) option_value
  left join public.challenge_responses r
    on r.question_id = q.id and r.challenge_id = q.challenge_id and r.answer = to_jsonb(option_value)
  where q.challenge_id = p_challenge_id
    and c.owner_id = auth.uid()
  group by q.id, q.position, q.prompt, option_value
  order by q.position, count(r.id) desc, option_value;
$$;

revoke all on function public.submit_challenge_answers(text, jsonb) from public, anon, authenticated;
revoke all on function public.get_challenge_ranking(text, integer, integer) from public, anon, authenticated;
revoke all on function public.get_challenge_results(uuid) from public, anon, authenticated;
grant execute on function public.submit_challenge_answers(text, jsonb) to authenticated;
grant execute on function public.get_challenge_ranking(text, integer, integer) to anon, authenticated;
grant execute on function public.get_challenge_results(uuid) to authenticated;

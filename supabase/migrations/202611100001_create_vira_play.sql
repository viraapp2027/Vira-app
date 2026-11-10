-- VIRA Play — Fase 3, fundação persistente.
-- Esta migration cria apenas o modelo seguro; telas e operações serão entregues em fatias verificáveis.

create table if not exists public.vira_play_question_bank (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('friendship', 'relationship', 'compatibility', 'fun', 'opinion')),
  prompt text not null check (char_length(prompt) between 5 and 240),
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  description text not null default '' check (char_length(description) <= 300),
  kind text not null check (kind in ('friendship', 'relationship', 'compatibility', 'fun', 'opinion', 'custom')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  share_token text not null unique default encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.challenge_questions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  question_bank_id uuid references public.vira_play_question_bank (id) on delete set null,
  prompt text not null check (char_length(prompt) between 5 and 240),
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  position integer not null check (position >= 0 and position < 50),
  created_at timestamptz not null default now(),
  unique (challenge_id, position)
);

create table if not exists public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  participant_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (challenge_id, participant_id)
);

create table if not exists public.challenge_responses (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  question_id uuid not null references public.challenge_questions (id) on delete cascade,
  participant_id uuid not null references auth.users (id) on delete cascade,
  answer jsonb not null,
  created_at timestamptz not null default now(),
  unique (question_id, participant_id)
);

create index if not exists challenges_owner_id_created_at_idx on public.challenges (owner_id, created_at desc);
create index if not exists challenges_share_token_idx on public.challenges (share_token);
create index if not exists challenge_questions_challenge_position_idx on public.challenge_questions (challenge_id, position);
create index if not exists challenge_participants_participant_id_idx on public.challenge_participants (participant_id);
create index if not exists challenge_responses_participant_id_idx on public.challenge_responses (participant_id);

create or replace function public.set_vira_play_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_vira_play_updated_at() from public, anon, authenticated;
drop trigger if exists challenges_set_updated_at on public.challenges;
create trigger challenges_set_updated_at
before update on public.challenges
for each row execute function public.set_vira_play_updated_at();

alter table public.vira_play_question_bank enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_questions enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.challenge_responses enable row level security;

revoke all on table public.vira_play_question_bank, public.challenges, public.challenge_questions, public.challenge_participants, public.challenge_responses from anon, authenticated;
grant select on table public.vira_play_question_bank to authenticated;
grant select, insert, update, delete on table public.challenges to authenticated;
grant select, insert, update, delete on table public.challenge_questions to authenticated;
grant select, insert on table public.challenge_participants to authenticated;
grant select, insert, update on table public.challenge_responses to authenticated;

drop policy if exists vira_play_question_bank_select_active on public.vira_play_question_bank;
create policy vira_play_question_bank_select_active
on public.vira_play_question_bank for select
to authenticated
using (is_active);

drop policy if exists challenges_select_own on public.challenges;
create policy challenges_select_own
on public.challenges for select
to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists challenges_insert_own on public.challenges;
create policy challenges_insert_own
on public.challenges for insert
to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists challenges_update_own on public.challenges;
create policy challenges_update_own
on public.challenges for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists challenges_delete_own on public.challenges;
create policy challenges_delete_own
on public.challenges for delete
to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists challenge_questions_select_own on public.challenge_questions;
create policy challenge_questions_select_own
on public.challenge_questions for select
to authenticated
using (exists (select 1 from public.challenges c where c.id = challenge_id and c.owner_id = (select auth.uid())));

drop policy if exists challenge_questions_insert_own on public.challenge_questions;
create policy challenge_questions_insert_own
on public.challenge_questions for insert
to authenticated
with check (exists (select 1 from public.challenges c where c.id = challenge_id and c.owner_id = (select auth.uid())));

drop policy if exists challenge_questions_update_own on public.challenge_questions;
create policy challenge_questions_update_own
on public.challenge_questions for update
to authenticated
using (exists (select 1 from public.challenges c where c.id = challenge_id and c.owner_id = (select auth.uid())))
with check (exists (select 1 from public.challenges c where c.id = challenge_id and c.owner_id = (select auth.uid())));

drop policy if exists challenge_questions_delete_own on public.challenge_questions;
create policy challenge_questions_delete_own
on public.challenge_questions for delete
to authenticated
using (exists (select 1 from public.challenges c where c.id = challenge_id and c.owner_id = (select auth.uid())));

drop policy if exists challenge_participants_select_own on public.challenge_participants;
create policy challenge_participants_select_own
on public.challenge_participants for select
to authenticated
using ((select auth.uid()) = participant_id or exists (select 1 from public.challenges c where c.id = challenge_id and c.owner_id = (select auth.uid())));

drop policy if exists challenge_participants_insert_self on public.challenge_participants;
create policy challenge_participants_insert_self
on public.challenge_participants for insert
to authenticated
with check ((select auth.uid()) = participant_id);

drop policy if exists challenge_responses_select_own on public.challenge_responses;
create policy challenge_responses_select_own
on public.challenge_responses for select
to authenticated
using ((select auth.uid()) = participant_id or exists (select 1 from public.challenges c where c.id = challenge_id and c.owner_id = (select auth.uid())));

drop policy if exists challenge_responses_insert_own on public.challenge_responses;
create policy challenge_responses_insert_own
on public.challenge_responses for insert
to authenticated
with check ((select auth.uid()) = participant_id and exists (select 1 from public.challenge_participants p where p.challenge_id = challenge_id and p.participant_id = (select auth.uid())));

drop policy if exists challenge_responses_update_own on public.challenge_responses;
create policy challenge_responses_update_own
on public.challenge_responses for update
to authenticated
using ((select auth.uid()) = participant_id)
with check ((select auth.uid()) = participant_id);

insert into public.vira_play_question_bank (kind, prompt, options)
values
  ('friendship', 'Qual programa combina mais com um fim de semana entre amigos?', '["Cinema", "Trilha", "Jogar conversa fora", "Qualquer um dos anteriores"]'::jsonb),
  ('friendship', 'Qual destas características mais fortalece uma amizade?', '["Escuta", "Lealdade", "Bom humor", "Todas as anteriores"]'::jsonb),
  ('relationship', 'Qual é uma boa forma de demonstrar carinho?', '["Respeitar o espaço", "Conversar com sinceridade", "Estar presente", "Todas as anteriores"]'::jsonb),
  ('compatibility', 'Qual assunto você gostaria de descobrir em comum?', '["Música", "Viagens", "Comida", "Filmes e séries"]'::jsonb),
  ('fun', 'Qual seria seu superpoder em um rolê?', '["Escolher a playlist", "Encontrar o melhor lugar", "Fazer todo mundo rir", "Chegar no horário"]'::jsonb),
  ('opinion', 'Qual combinação merece mais respeito?', '["Pizza e conversa", "Café e ideias", "Praia e música", "Jogo e torcida"]'::jsonb)
on conflict do nothing;

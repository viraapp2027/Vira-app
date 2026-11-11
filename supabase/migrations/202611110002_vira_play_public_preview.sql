-- VIRA Play — prévia pública segura.
-- Rascunhos e desafios arquivados continuam privados; somente publicados podem ser pré-visualizados.

grant select on table public.challenges, public.challenge_questions to anon;

drop policy if exists challenges_select_published_public on public.challenges;
create policy challenges_select_published_public
on public.challenges for select
to anon, authenticated
using (status = 'published');

drop policy if exists challenge_questions_select_published_public on public.challenge_questions;
create policy challenge_questions_select_published_public
on public.challenge_questions for select
to anon, authenticated
using (exists (
  select 1 from public.challenges c
  where c.id = challenge_id and c.status = 'published'
));

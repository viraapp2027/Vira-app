import { useEffect, useState } from 'react';
import { Check, Gamepad2, LockKeyhole, Send } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../features/auth/AuthContext';
import { supabase } from '../lib/supabase/client';

type Challenge = { id: string; title: string; description: string; kind: string };
type ChallengeQuestion = { id: string; prompt: string; options: string[]; position: number };

export function PublicChallengePage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadChallenge() {
      if (!supabase || !shareToken) { if (active) setLoading(false); return; }
      const found = await supabase.from('challenges').select('id, title, description, kind').eq('share_token', shareToken).eq('status', 'published').maybeSingle();
      if (!active) return;
      if (found.error || !found.data) { setError('Este desafio não existe ou não está disponível.'); setLoading(false); return; }
      const questionResult = await supabase.from('challenge_questions').select('id, prompt, options, position').eq('challenge_id', found.data.id).order('position');
      if (!active) return;
      if (questionResult.error) setError('Não foi possível carregar as perguntas deste desafio.');
      else { setChallenge(found.data as Challenge); setQuestions((questionResult.data ?? []) as ChallengeQuestion[]); }
      setLoading(false);
    }
    void loadChallenge();
    return () => { active = false; };
  }, [shareToken]);

  function choose(questionId: string, answer: string) { setAnswers((current) => ({ ...current, [questionId]: answer })); }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user || !challenge) return;
    setError('');
    if (questions.some((question) => !answers[question.id])) { setError('Responda todas as perguntas antes de enviar.'); return; }
    setSending(true);
    const existing = await supabase.from('challenge_participants').select('id').eq('challenge_id', challenge.id).eq('participant_id', user.id).maybeSingle();
    if (existing.error) { setError('Não foi possível verificar sua participação.'); setSending(false); return; }
    if (!existing.data) {
      const joined = await supabase.from('challenge_participants').insert({ challenge_id: challenge.id, participant_id: user.id });
      if (joined.error) { setError('Não foi possível entrar neste desafio.'); setSending(false); return; }
    }
    const responseResult = await supabase.from('challenge_responses').upsert(questions.map((question) => ({ challenge_id: challenge.id, question_id: question.id, participant_id: user.id, answer: answers[question.id] })), { onConflict: 'question_id,participant_id' });
    if (responseResult.error) setError('Não foi possível salvar suas respostas.');
    else setSubmitted(true);
    setSending(false);
  }

  if (loading) return <AppShell><div className="state-card"><p>Carregando desafio…</p></div></AppShell>;
  if (!challenge) return <AppShell><div className="state-card"><Gamepad2 size={30} aria-hidden="true" /><h1>Desafio indisponível</h1><p>{error || 'Este link não está mais disponível.'}</p><Link className="button button--quiet" to="/app">Voltar ao VIRA</Link></div></AppShell>;

  return <AppShell showNavigation={Boolean(user)}>
    <section className="public-challenge-heading"><span className="eyebrow">VIRA Play</span><h1>{challenge.title}</h1><p>{challenge.description || 'Uma brincadeira criada para descobrir o que aproxima vocês.'}</p></section>
    {error && <div className="notice notice--warning" role="alert">{error}</div>}
    {submitted ? <section className="dashboard-card challenge-success"><Check size={28} aria-hidden="true" /><h2>Respostas salvas.</h2><p>Você participou deste desafio. Obrigado por entrar na brincadeira.</p><Link className="button button--quiet" to="/app">Voltar ao VIRA</Link></section> : <form className="dashboard-card public-challenge-form" onSubmit={(event) => void handleSubmit(event)}>
      {questions.map((question, index) => <fieldset className="public-question" key={question.id}><legend><span>{index + 1}</span>{question.prompt}</legend><div className="public-options">{question.options.map((option) => <label className={`public-option ${answers[question.id] === option ? 'is-selected' : ''}`} key={option}><input type="radio" name={question.id} value={option} checked={answers[question.id] === option} onChange={() => choose(question.id, option)} />{option}</label>)}</div></fieldset>)}
      {user ? <button className="button button--primary button--full" type="submit" disabled={sending}><Send size={17} aria-hidden="true" /> {sending ? 'Enviando…' : 'Enviar respostas'}</button> : <div className="login-to-participate"><LockKeyhole size={18} aria-hidden="true" /><p><strong>Quer participar?</strong> Entre ou crie sua conta para salvar suas respostas.</p><Link className="button button--quiet" to={`/entrar?redirect=/play/${shareToken}`}>Entrar para responder</Link></div>}
    </form>}
  </AppShell>;
}

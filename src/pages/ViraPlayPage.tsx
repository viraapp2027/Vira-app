import { useEffect, useState } from 'react';
import { Archive, Check, Edit3, Gamepad2, Plus, Send, Sparkles } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../features/auth/AuthContext';
import { supabase } from '../lib/supabase/client';

type ChallengeKind = 'friendship' | 'relationship' | 'compatibility' | 'fun' | 'opinion';
type ChallengeStatus = 'draft' | 'published' | 'archived';
type Question = { id: string; kind: ChallengeKind; prompt: string; options: string[] };
type Challenge = { id: string; title: string; kind: ChallengeKind; status: ChallengeStatus; share_token: string; updated_at: string };

const kindLabels: Record<ChallengeKind, string> = { friendship: 'Amizade', relationship: 'Relacionamento', compatibility: 'Compatibilidade', fun: 'Diversão', opinion: 'Opiniões' };
const statusLabels: Record<ChallengeStatus, string> = { draft: 'Rascunho', published: 'Publicado', archived: 'Arquivado' };

export function ViraPlayPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<ChallengeKind>('friendship');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadPlayData() {
    if (!supabase || !user) { setLoading(false); return; }
    setLoading(true);
    const [questionResult, challengeResult] = await Promise.all([
      supabase.from('vira_play_question_bank').select('id, kind, prompt, options').eq('is_active', true).order('created_at'),
      supabase.from('challenges').select('id, title, kind, status, share_token, updated_at').eq('owner_id', user.id).order('updated_at', { ascending: false }),
    ]);
    if (questionResult.error || challengeResult.error) setError('Não foi possível carregar seus dados do VIRA Play.');
    else { setQuestions((questionResult.data ?? []) as Question[]); setChallenges((challengeResult.data ?? []) as Challenge[]); }
    setLoading(false);
  }

  useEffect(() => { void loadPlayData(); }, [user?.id]);

  const availableQuestions = questions.filter((question) => question.kind === kind);

  function resetBuilder() { setEditingId(null); setTitle(''); setKind('friendship'); setSelected([]); }
  function toggleQuestion(id: string) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }

  async function openChallenge(challenge: Challenge) {
    if (!supabase) return;
    setError('');
    const result = await supabase.from('challenge_questions').select('question_bank_id').eq('challenge_id', challenge.id).order('position');
    if (result.error) { setError('Não foi possível abrir este desafio.'); return; }
    setEditingId(challenge.id);
    setTitle(challenge.title);
    setKind(challenge.kind);
    setSelected((result.data ?? []).map((item) => item.question_bank_id).filter(Boolean) as string[]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setSuccess('');
    if (!supabase || !user) return setError('Sua sessão não está disponível. Entre novamente para criar um desafio.');
    if (title.trim().length < 3) return setError('Dê um nome com pelo menos 3 caracteres ao desafio.');
    if (selected.length === 0) return setError('Escolha pelo menos uma pergunta.');
    setSaving(true);
    const selectedQuestions = questions.filter((question) => selected.includes(question.id));
    let challengeId = editingId;
    let shareToken = challenges.find((item) => item.id === editingId)?.share_token ?? '';
    if (editingId) {
      const update = await supabase.from('challenges').update({ title: title.trim(), kind }).eq('id', editingId).eq('owner_id', user.id);
      if (update.error) { setError('Não foi possível atualizar o desafio.'); setSaving(false); return; }
      const remove = await supabase.from('challenge_questions').delete().eq('challenge_id', editingId);
      if (remove.error) { setError('Não foi possível atualizar as perguntas.'); setSaving(false); return; }
    } else {
      const create = await supabase.from('challenges').insert({ owner_id: user.id, title: title.trim(), kind, status: 'draft' }).select('id, share_token').single();
      if (create.error || !create.data) { setError('Não foi possível criar o desafio.'); setSaving(false); return; }
      challengeId = create.data.id; shareToken = create.data.share_token;
    }
    const questionInsert = await supabase.from('challenge_questions').insert(selectedQuestions.map((question, position) => ({ challenge_id: challengeId, question_bank_id: question.id, prompt: question.prompt, options: question.options, position })));
    if (questionInsert.error) { setError('Não foi possível salvar as perguntas.'); setSaving(false); return; }
    setSuccess(editingId ? 'Desafio atualizado.' : `Desafio criado como rascunho. Código: ${shareToken}`);
    resetBuilder(); setSaving(false); await loadPlayData();
  }

  async function setChallengeStatus(challenge: Challenge, status: ChallengeStatus) {
    if (!supabase) return;
    setError('');
    const result = await supabase.from('challenges').update({ status }).eq('id', challenge.id).eq('owner_id', user?.id);
    if (result.error) setError('Não foi possível atualizar o status do desafio.');
    else { setSuccess(status === 'published' ? 'Desafio publicado.' : 'Desafio arquivado.'); await loadPlayData(); }
  }

  return (
    <AppShell>
      <section className="app-page-heading"><div><span className="eyebrow">VIRA Play</span><h1>Crie um desafio para aproximar.</h1><p>Monte, revise e publique brincadeiras com perguntas leves para compartilhar.</p></div><Gamepad2 size={34} aria-hidden="true" /></section>
      {error && <div className="notice notice--warning" role="alert">{error}</div>}
      {success && <div className="notice notice--success" role="status"><Check size={17} aria-hidden="true" /> {success}</div>}
      <div className="play-layout">
        <form className="dashboard-card play-builder" onSubmit={(event) => void handleSave(event)}>
          <span className="eyebrow">{editingId ? 'Editar desafio' : 'Novo desafio'}</span><h2>{editingId ? 'Revise sua brincadeira' : 'Monte sua brincadeira'}</h2>
          <label className="field-label" htmlFor="challenge-title">Nome do desafio</label><input id="challenge-title" className="text-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Quanto você me conhece?" maxLength={80} />
          <label className="field-label" htmlFor="challenge-kind">Tipo</label><select id="challenge-kind" className="text-input" value={kind} onChange={(event) => { setKind(event.target.value as ChallengeKind); setSelected([]); }}>{Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <button className="button button--primary button--full" type="submit" disabled={saving || loading}>{saving ? 'Salvando…' : <><Plus size={17} aria-hidden="true" /> {editingId ? 'Salvar alterações' : 'Criar rascunho'}</>}</button>
          {editingId && <button className="button button--quiet button--full" type="button" onClick={resetBuilder}>Cancelar edição</button>}
        </form>
        <section className="dashboard-card play-questions"><span className="eyebrow">Perguntas disponíveis</span><h2>Escolha o que combina com vocês</h2>{loading && <p>Carregando perguntas…</p>}{!loading && availableQuestions.length === 0 && <p>As perguntas ainda não estão disponíveis.</p>}<div className="question-list">{availableQuestions.map((question) => <label className={`question-choice ${selected.includes(question.id) ? 'is-selected' : ''}`} key={question.id}><input type="checkbox" checked={selected.includes(question.id)} onChange={() => toggleQuestion(question.id)} /><span><strong>{question.prompt}</strong><small>{question.options.join(' · ')}</small></span></label>)}</div><div className="profile-banner"><Sparkles size={18} aria-hidden="true" /><p><strong>Você controla o ritmo.</strong> Rascunhos podem ser revisados antes de serem publicados.</p></div></section>
      </div>
      <section className="dashboard-card play-library"><div className="play-library__heading"><div><span className="eyebrow">Sua biblioteca</span><h2>Meus desafios</h2></div><span className="play-count">{challenges.length} {challenges.length === 1 ? 'desafio' : 'desafios'}</span></div>
        {loading && <p>Carregando seus desafios…</p>}
        {!loading && challenges.length === 0 && <p>Seus desafios aparecerão aqui depois que você criar o primeiro.</p>}
        <div className="challenge-list">{challenges.map((challenge) => <article className="challenge-item" key={challenge.id}><div><strong>{challenge.title}</strong><span>{kindLabels[challenge.kind]} · <em className={`challenge-status challenge-status--${challenge.status}`}>{statusLabels[challenge.status]}</em></span><small>Código: {challenge.share_token}</small></div><div className="challenge-item__actions">{challenge.status !== 'archived' && <button className="button button--quiet" type="button" onClick={() => void openChallenge(challenge)}><Edit3 size={15} aria-hidden="true" /> Editar</button>}{challenge.status === 'draft' && <button className="button button--quiet" type="button" onClick={() => void setChallengeStatus(challenge, 'published')}><Send size={15} aria-hidden="true" /> Publicar</button>}{challenge.status === 'published' && <button className="button button--quiet" type="button" onClick={() => void setChallengeStatus(challenge, 'archived')}><Archive size={15} aria-hidden="true" /> Arquivar</button>}</div></article>)}</div>
      </section>
    </AppShell>
  );
}

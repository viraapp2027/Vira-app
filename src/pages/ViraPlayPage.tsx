import { useEffect, useState } from 'react';
import { Check, Gamepad2, Plus, Sparkles } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../features/auth/AuthContext';
import { supabase } from '../lib/supabase/client';

type ChallengeKind = 'friendship' | 'relationship' | 'compatibility' | 'fun' | 'opinion';

type Question = {
  id: string;
  kind: ChallengeKind;
  prompt: string;
  options: string[];
};

const kindLabels: Record<ChallengeKind, string> = {
  friendship: 'Amizade',
  relationship: 'Relacionamento',
  compatibility: 'Compatibilidade',
  fun: 'Diversão',
  opinion: 'Opiniões',
};

export function ViraPlayPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<ChallengeKind>('friendship');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    async function loadQuestions() {
      if (!supabase) {
        if (active) { setError('O banco do VIRA Play ainda não está conectado neste ambiente.'); setLoading(false); }
        return;
      }
      const result = await supabase.from('vira_play_question_bank').select('id, kind, prompt, options').eq('is_active', true).order('created_at');
      if (!active) return;
      if (result.error) setError('Não foi possível carregar as perguntas do VIRA Play.');
      else setQuestions((result.data ?? []) as Question[]);
      setLoading(false);
    }
    void loadQuestions();
    return () => { active = false; };
  }, []);

  const availableQuestions = questions.filter((question) => question.kind === kind);

  function toggleQuestion(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!supabase || !user) return setError('Sua sessão não está disponível. Entre novamente para criar um desafio.');
    if (title.trim().length < 3) return setError('Dê um nome com pelo menos 3 caracteres ao desafio.');
    if (selected.length === 0) return setError('Escolha pelo menos uma pergunta.');

    setSaving(true);
    const challenge = await supabase.from('challenges').insert({ owner_id: user.id, title: title.trim(), kind, status: 'draft' }).select('id, share_token').single();
    if (challenge.error || !challenge.data) {
      setError('Não foi possível criar o desafio. Tente novamente em instantes.');
      setSaving(false);
      return;
    }
    const selectedQuestions = questions.filter((question) => selected.includes(question.id));
    const questionInsert = await supabase.from('challenge_questions').insert(selectedQuestions.map((question, position) => ({ challenge_id: challenge.data.id, question_bank_id: question.id, prompt: question.prompt, options: question.options, position })));
    if (questionInsert.error) {
      await supabase.from('challenges').delete().eq('id', challenge.data.id);
      setError('O desafio foi iniciado, mas não foi possível salvar as perguntas.');
      setSaving(false);
      return;
    }
    setSuccess(`Desafio criado como rascunho. Código de compartilhamento: ${challenge.data.share_token}`);
    setTitle('');
    setSelected([]);
    setSaving(false);
  }

  return (
    <AppShell>
      <section className="app-page-heading">
        <div><span className="eyebrow">VIRA Play</span><h1>Crie um desafio para aproximar.</h1><p>Escolha perguntas, dê um nome e prepare uma brincadeira para compartilhar com quem importa.</p></div>
        <Gamepad2 size={34} aria-hidden="true" />
      </section>
      {error && <div className="notice notice--warning" role="alert">{error}</div>}
      {success && <div className="notice notice--success" role="status"><Check size={17} aria-hidden="true" /> {success}</div>}
      <div className="play-layout">
        <form className="dashboard-card play-builder" onSubmit={(event) => void handleCreate(event)}>
          <span className="eyebrow">Novo desafio</span>
          <h2>Monte sua brincadeira</h2>
          <label className="field-label" htmlFor="challenge-title">Nome do desafio</label>
          <input id="challenge-title" className="text-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Quanto você me conhece?" maxLength={80} />
          <label className="field-label" htmlFor="challenge-kind">Tipo</label>
          <select id="challenge-kind" className="text-input" value={kind} onChange={(event) => { setKind(event.target.value as ChallengeKind); setSelected([]); }}>
            {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button className="button button--primary button--full" type="submit" disabled={saving || loading}>{saving ? 'Salvando…' : <><Plus size={17} aria-hidden="true" /> Criar rascunho</>}</button>
        </form>
        <section className="dashboard-card play-questions">
          <span className="eyebrow">Perguntas disponíveis</span>
          <h2>Escolha o que combina com vocês</h2>
          {loading && <p>Carregando perguntas…</p>}
          {!loading && availableQuestions.length === 0 && <p>As perguntas ainda não estão disponíveis. Assim que o banco do VIRA Play for aplicado, elas aparecerão aqui.</p>}
          <div className="question-list">
            {availableQuestions.map((question) => <label className={`question-choice ${selected.includes(question.id) ? 'is-selected' : ''}`} key={question.id}><input type="checkbox" checked={selected.includes(question.id)} onChange={() => toggleQuestion(question.id)} /><span><strong>{question.prompt}</strong><small>{question.options.join(' · ')}</small></span></label>)}
          </div>
          <div className="profile-banner"><Sparkles size={18} aria-hidden="true" /><p><strong>Comece simples.</strong> Nesta primeira versão, o desafio é salvo como rascunho para você revisar antes de compartilhar.</p></div>
        </section>
      </div>
    </AppShell>
  );
}

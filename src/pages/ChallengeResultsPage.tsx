import { useEffect, useMemo, useState } from 'react';
import { BarChart3, ChevronLeft, Medal, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../features/auth/AuthContext';
import { supabase } from '../lib/supabase/client';

type Challenge = { id: string; title: string; status: string };
type RankingRow = { rank: number; participant_id: string; display_name: string; answered_count: number; total_questions: number; completed_at: string | null };
type ResultRow = { question_id: string; prompt: string; option: string; response_count: number };

export function ChallengeResultsPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase || !user || !shareToken) { setLoading(false); return; }
      const found = await supabase.from('challenges').select('id, title, status').eq('share_token', shareToken).eq('owner_id', user.id).maybeSingle();
      if (!active) return;
      if (found.error || !found.data) { setError('Você não tem acesso aos resultados deste desafio.'); setLoading(false); return; }
      const [rankingResult, resultsResult] = await Promise.all([
        supabase.rpc('get_challenge_ranking', { p_share_token: shareToken, p_limit: 50, p_offset: 0 }),
        supabase.rpc('get_challenge_results', { p_challenge_id: found.data.id }),
      ]);
      if (!active) return;
      if (rankingResult.error || resultsResult.error) setError('Não foi possível carregar os resultados agora.');
      else { setChallenge(found.data as Challenge); setRanking((rankingResult.data ?? []) as RankingRow[]); setResults((resultsResult.data ?? []) as ResultRow[]); }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [shareToken, user?.id]);

  const groupedResults = useMemo(() => {
    const groups = new Map<string, ResultRow[]>();
    results.forEach((row) => groups.set(row.question_id, [...(groups.get(row.question_id) ?? []), row]));
    return [...groups.values()];
  }, [results]);
  const totalParticipants = ranking.length;
  const completedParticipants = ranking.filter((row) => row.answered_count === row.total_questions && row.total_questions > 0).length;

  if (loading) return <AppShell><div className="state-card"><p>Calculando resultados…</p></div></AppShell>;
  if (!challenge) return <AppShell><div className="state-card"><BarChart3 size={30} aria-hidden="true" /><h1>Resultados indisponíveis</h1><p>{error || 'Este desafio não foi encontrado.'}</p><Link className="button button--quiet" to="/play">Voltar ao VIRA Play</Link></div></AppShell>;

  return <AppShell>
    <section className="app-page-heading"><div><span className="eyebrow">VIRA Play · Resultados</span><h1>{challenge.title}</h1><p>Veja a participação e as escolhas mais populares, sem expor respostas individuais.</p></div><BarChart3 size={34} aria-hidden="true" /></section>
    {error && <div className="notice notice--warning" role="alert">{error}</div>}
    <div className="results-summary"><div className="dashboard-card result-stat"><Users size={19} aria-hidden="true" /><strong>{totalParticipants}</strong><span>participantes</span></div><div className="dashboard-card result-stat"><Medal size={19} aria-hidden="true" /><strong>{completedParticipants}</strong><span>concluíram</span></div></div>
    <section className="dashboard-card results-panel"><div className="results-panel__heading"><div><span className="eyebrow">Ranking de participação</span><h2>Quem entrou na brincadeira</h2></div><Link className="button button--quiet" to={`/play/${shareToken}/ranking`}>Abrir ranking</Link></div>{ranking.length === 0 ? <p>Ninguém respondeu ainda.</p> : <div className="ranking-list">{ranking.slice(0, 10).map((row) => <div className="ranking-row" key={row.participant_id}><strong>#{row.rank}</strong><span>{row.display_name}</span><small>{row.answered_count}/{row.total_questions} respostas</small></div>)}</div>}</section>
    <section className="dashboard-card results-panel"><span className="eyebrow">Resumo por pergunta</span><h2>O que as pessoas escolheram</h2>{groupedResults.length === 0 && <p>As respostas aparecerão aqui quando alguém concluir o desafio.</p>}{groupedResults.map((group) => { const total = group.reduce((sum, row) => sum + Number(row.response_count), 0); return <article className="result-question" key={group[0].question_id}><h3>{group[0].prompt}</h3>{group.map((row) => <div className="result-option" key={row.option}><span>{row.option}</span><strong>{row.response_count}</strong><div className="result-bar"><i style={{ width: `${total ? (Number(row.response_count) / total) * 100 : 0}%` }} /></div></div>)}</article>; })}</section>
    <Link className="back-link" to="/play"><ChevronLeft size={16} aria-hidden="true" /> Voltar aos meus desafios</Link>
  </AppShell>;
}

export function ChallengeRankingPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { async function load() { if (!supabase || !shareToken) return setLoading(false); const result = await supabase.rpc('get_challenge_ranking', { p_share_token: shareToken, p_limit: 100, p_offset: 0 }); if (!result.error) setRanking((result.data ?? []) as RankingRow[]); setLoading(false); } void load(); }, [shareToken]);
  return <AppShell><section className="app-page-heading"><div><span className="eyebrow">VIRA Play</span><h1>Ranking de participação</h1><p>Uma classificação leve, baseada na conclusão das perguntas.</p></div><Medal size={34} aria-hidden="true" /></section><section className="dashboard-card results-panel">{loading ? <p>Carregando ranking…</p> : ranking.length === 0 ? <p>Ninguém participou ainda.</p> : <div className="ranking-list ranking-list--large">{ranking.map((row) => <div className={`ranking-row ${row.rank <= 3 ? 'ranking-row--top' : ''}`} key={row.participant_id}><strong>#{row.rank}</strong><span>{row.display_name}</span><small>{row.answered_count}/{row.total_questions} respostas</small></div>)}</div>}</section><Link className="back-link" to={`/play/${shareToken}`}><ChevronLeft size={16} aria-hidden="true" /> Voltar ao desafio</Link></AppShell>;
}

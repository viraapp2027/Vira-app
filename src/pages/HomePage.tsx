import { Navigate, Link } from 'react-router-dom';
import { ArrowRight, Gamepad2, Heart, MapPin, PencilLine, ShieldCheck, Sparkles } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { useAuth } from '../features/auth/AuthContext';
import { useProfile } from '../features/profile/ProfileContext';
import { calculateAge } from '../features/profile/profileOptions';

export function HomePage() {
  const { user } = useAuth();
  const { profile, loading, error, refresh } = useProfile();
  if (loading) return <LoadingScreen message="Carregando seu espaço…" />;
  if (!profile) return <Navigate to="/onboarding" replace />;

  const initials = profile.display_name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'V';
  const age = calculateAge(profile.date_of_birth);

  return (
    <AppShell>
      <section className="app-page-heading">
        <div><span className="eyebrow">Sua VIRA começa aqui</span><h1>Oi, {profile.display_name.split(' ')[0]}.</h1><p>Seu perfil já está guardado com segurança. Este é o começo de uma plataforma feita para aproximar pessoas.</p></div>
        <Link className="button button--outline" to="/perfil/editar"><PencilLine size={17} aria-hidden="true" /> Editar perfil</Link>
      </section>
      {error && <div className="notice notice--warning" role="alert"><strong>Não conseguimos atualizar seu resumo.</strong><span>{error} <button className="inline-button" type="button" onClick={() => void refresh()}>Tentar novamente</button></span></div>}
      <div className="dashboard-grid">
        <section className="dashboard-card">
          <div className="profile-mini">
            <div className="profile-avatar" aria-hidden="true">{initials}</div>
            <div><h2>{profile.display_name}{age >= 18 ? `, ${age}` : ''}</h2><p>{profile.city}, {profile.state}</p></div>
          </div>
          <p>{profile.bio || 'Seu perfil está pronto para receber uma história sua. Você pode adicionar uma bio quando quiser.'}</p>
          <div className="tag-list">{profile.interests.map((interest) => <span className="tag" key={interest}>{interest}</span>)}{profile.interests.length === 0 && <span className="tag">Adicione seus interesses</span>}</div>
          <div className="profile-actions"><Link className="text-link" to="/perfil">Ver meu perfil <ArrowRight size={16} aria-hidden="true" /></Link></div>
        </section>
        <section className="dashboard-card">
          <span className="eyebrow">Seu ponto de partida</span>
          <h2>Conexões com intenção.</h2>
          <p>Você escolheu caminhos para a sua experiência. A VIRA vai liberar as ferramentas sociais por etapas, sem apresentar como prontas as que ainda estão em construção.</p>
          <div className="profile-detail-list">
            <div className="profile-detail"><Heart size={17} aria-hidden="true" /><span>{profile.intentions.length} {profile.intentions.length === 1 ? 'intenção selecionada' : 'intenções selecionadas'}</span></div>
            <div className="profile-detail"><MapPin size={17} aria-hidden="true" /><span>Localização aproximada: {profile.city}, {profile.state}</span></div>
            <div className="profile-detail"><ShieldCheck size={17} aria-hidden="true" /><span>Data de nascimento mantida em privado</span></div>
          </div>
          <Link className="button button--quiet" to="/perfil/editar"><PencilLine size={16} aria-hidden="true" /> Atualizar minhas escolhas</Link>
        </section>
      </div>
      <section className="profile-banner" aria-label="Nota sobre a primeira fase">
        <Sparkles size={19} aria-hidden="true" />
        <p><strong>Estamos construindo com cuidado.</strong> Seu cadastro e perfil já ficam salvos no Supabase. Descoberta, chat, desafios, grupos e rolês serão entregues em próximas fases.</p>
      </section>
      <section className="dashboard-card play-home-card">
        <div><span className="eyebrow">VIRA Play</span><h2>Uma pergunta pode virar uma conexão.</h2><p>Crie um desafio com perguntas leves e descubra o que aproxima vocês.</p></div>
        <Link className="button button--quiet" to="/play"><Gamepad2 size={17} aria-hidden="true" /> Criar desafio</Link>
      </section>
      <span className="sr-only">Conta autenticada: {user?.email}</span>
    </AppShell>
  );
}

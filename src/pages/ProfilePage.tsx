import { Link } from 'react-router-dom';
import { CalendarDays, Heart, MapPin, PencilLine, ShieldCheck, Sparkles } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { useProfile } from '../features/profile/ProfileContext';
import { calculateAge, INTENTION_OPTIONS } from '../features/profile/profileOptions';

export function ProfilePage() {
  const { profile, loading } = useProfile();
  if (loading) return <LoadingScreen message="Abrindo seu perfil…" />;
  if (!profile) return null;

  const initials = profile.display_name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'V';
  const age = calculateAge(profile.date_of_birth);
  const intentionLabels = new Map(INTENTION_OPTIONS.map((option) => [option.value, option.label]));

  return (
    <AppShell>
      <section className="app-page-heading"><div><span className="eyebrow">Esse perfil é seu</span><h1>Meu perfil</h1><p>Veja as informações que você escolheu compartilhar com o VIRA.</p></div><Link className="button button--outline" to="/perfil/editar"><PencilLine size={17} aria-hidden="true" /> Editar perfil</Link></section>
      <section className="profile-summary">
        <div className="profile-summary__top"><div className="profile-avatar" aria-hidden="true">{initials}</div><div><h1>{profile.display_name}{age >= 18 ? `, ${age}` : ''}</h1><p><MapPin size={15} aria-hidden="true" /> {profile.city}, {profile.state}</p></div></div>
        <div className="profile-detail-list">
          <div className="profile-detail"><CalendarDays size={17} aria-hidden="true" /><span>Idade calculada a partir da data de nascimento, que permanece privada.</span></div>
          <div className="profile-detail"><ShieldCheck size={17} aria-hidden="true" /><span>Somente sua conta autorizada pode ler e atualizar estes dados nesta fase.</span></div>
        </div>
        <div className="profile-section"><h2>Sobre mim</h2><p className="profile-bio">{profile.bio || 'Você ainda não adicionou uma biografia.'}</p></div>
        <div className="profile-section"><h2><Sparkles size={17} aria-hidden="true" /> Interesses</h2><div className="tag-list">{profile.interests.length ? profile.interests.map((interest) => <span className="tag" key={interest}>{interest}</span>) : <span className="profile-muted">Nenhum interesse selecionado ainda.</span>}</div></div>
        <div className="profile-section"><h2><Heart size={17} aria-hidden="true" /> Intenções</h2><div className="tag-list">{profile.intentions.map((intention) => <span className="tag" key={intention}>{intentionLabels.get(intention) ?? intention}</span>)}</div></div>
      </section>
    </AppShell>
  );
}

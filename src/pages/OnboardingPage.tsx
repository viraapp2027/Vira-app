import { Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ProfileForm } from '../features/profile/ProfileForm';
import { useProfile } from '../features/profile/ProfileContext';

export function OnboardingPage() {
  const { profile, loading, error, refresh, saveProfile } = useProfile();
  const navigate = useNavigate();
  if (loading) return <LoadingScreen message="Preparando seu perfil…" />;
  if (!profile) {
    return <main className="center-state"><section className="state-card"><p className="eyebrow">Quase lá</p><h1>Não encontramos seu perfil.</h1><p>{error ?? 'Confira a configuração do banco e tente novamente.'}</p><button className="button button--primary" type="button" onClick={() => void refresh()}>Tentar novamente</button></section></main>;
  }
  if (profile.onboarding_completed && profile.adult_attested && profile.adult_attested_at) return <Navigate to="/app" replace />;

  return (
    <AppShell showNavigation={false}>
      <section className="app-page-heading">
        <div><span className="eyebrow">Seu espaço começa por você</span><h1>Vamos montar seu perfil.</h1><p>Escolha o que quer compartilhar. Sua data de nascimento continua privada e a localização é apenas cidade e estado. A confirmação de 18 anos é uma autodeclaração nesta fase.</p><p>Se entrar com Google ou Facebook, a foto disponibilizada pelo provedor será importada para seu perfil depois desta etapa; você poderá trocá-la quando quiser.</p></div>
      </section>
      <ProfileForm profile={profile} submitLabel="Salvar e continuar" onSubmit={async (update) => { await saveProfile(update); navigate('/app', { replace: true }); }} />
    </AppShell>
  );
}

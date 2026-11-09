import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useProfile } from '../features/profile/ProfileContext';
import { LoadingScreen } from '../components/ui/LoadingScreen';

export function RequireOnboarding({ children }: { children: ReactNode }) {
  const { profile, loading, error, refresh } = useProfile();
  if (loading) return <LoadingScreen message="Carregando seu perfil…" />;
  if (error) {
    return <main className="center-state"><section className="state-card"><p className="eyebrow">Não conseguimos carregar</p><h1>Seu perfil não abriu.</h1><p>{error}</p><button className="button button--primary" type="button" onClick={() => void refresh()}>Tentar novamente</button></section></main>;
  }
  if (!profile) return <Navigate to="/onboarding" replace />;
  if (!profile.onboarding_completed || !profile.adult_attested || !profile.adult_attested_at) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { LoadingScreen } from '../components/ui/LoadingScreen';

export function OAuthCallbackPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const params = new URLSearchParams(`${location.search}&${location.hash.replace(/^#/, '')}`);
  const providerError = params.get('error') || params.get('error_description');

  useEffect(() => {
    if (providerError) {
      setError('O login foi cancelado ou não pôde ser concluído. Tente novamente.');
      return;
    }
    if (loading) return;
    if (user) {
      navigate('/onboarding', { replace: true });
      return;
    }
    setError('Não foi possível confirmar sua sessão. Volte ao login e tente novamente.');
  }, [providerError, loading, user, navigate]);

  if (!error) return <LoadingScreen message="Concluindo seu acesso seguro ao VIRA…" />;

  return (
    <main className="center-state">
      <section className="state-card" aria-labelledby="oauth-error-title">
        <p className="eyebrow">Acesso não concluído</p>
        <h1 id="oauth-error-title">Não conseguimos entrar.</h1>
        <p role="alert">{error}</p>
        <Link className="button button--primary" to="/entrar">Voltar ao login</Link>
      </section>
    </main>
  );
}

import { useState } from 'react';
import type { SocialProvider } from '../../types/profile';
import { useAuth } from './AuthContext';

const PROVIDERS: ReadonlyArray<{ id: SocialProvider; label: string; mark: string }> = [
  { id: 'google', label: 'Google', mark: 'G' },
  { id: 'facebook', label: 'Facebook', mark: 'f' },
];

function providerError(error: unknown, provider: SocialProvider): string {
  const message = error instanceof Error ? error.message : '';
  if (/provider.*(not enabled|disabled|not configured)|unsupported provider|provider_is_disabled/i.test(message)) {
    return `O login com ${provider === 'google' ? 'Google' : 'Facebook'} ainda não está habilitado nas configurações do Supabase.`;
  }
  if (/identity_already_exists|already linked/i.test(message)) {
    return 'Este e-mail já está associado a outra forma de acesso. Entre usando o método original.';
  }
  return 'Não foi possível iniciar o login social. Tente novamente ou entre com e-mail e senha.';
}

export function SocialAuthButtons() {
  const { configured, signInWithProvider } = useAuth();
  const [busyProvider, setBusyProvider] = useState<SocialProvider | null>(null);
  const [error, setError] = useState('');

  async function handleProvider(provider: SocialProvider) {
    setError('');
    setBusyProvider(provider);
    try {
      await signInWithProvider(provider);
    } catch (caught) {
      setError(providerError(caught, provider));
      setBusyProvider(null);
    }
  }

  return (
    <div className="social-auth">
      <div className="social-auth__buttons">
        {PROVIDERS.map(({ id, label, mark }) => (
          <button
            className={`social-auth__button social-auth__button--${id}`}
            key={id}
            type="button"
            disabled={!configured || busyProvider !== null}
            onClick={() => void handleProvider(id)}
          >
            <span className="social-auth__mark" aria-hidden="true">{mark}</span>
            {busyProvider === id ? `Conectando ao ${label}…` : `Continuar com ${label}`}
          </button>
        ))}
      </div>
      {error && <p className="social-auth__error" role="alert">{error}</p>}
      <div className="social-auth__divider"><span>ou use seu e-mail</span></div>
    </div>
  );
}

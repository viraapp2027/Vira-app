import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthPageFrame } from '../components/layout/AuthPageFrame';
import { SocialAuthButtons } from '../features/auth/SocialAuthButtons';
import { useAuth } from '../features/auth/AuthContext';
import { isAdult } from '../features/profile/profileOptions';

function readableAuthError(message: string): string {
  if (/18|adult|idade/i.test(message)) return 'A VIRA é para pessoas com 18 anos ou mais.';
  if (/already registered|already exists/i.test(message)) return 'Este e-mail já tem uma conta. Entre para continuar.';
  return 'Não foi possível criar sua conta agora. Confira os dados e tente novamente.';
}

export function RegisterPage() {
  const { signUp, configured } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedAdult, setAcceptedAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!isAdult(dateOfBirth)) { setError('Você precisa ter 18 anos ou mais para criar uma conta.'); return; }
    if (!acceptedAdult) { setError('Confirme que você tem 18 anos ou mais para continuar.'); return; }
    setBusy(true);
    try {
      const result = await signUp({ displayName, dateOfBirth, email, password, adultAttested: acceptedAdult });
      if (result.needsEmailConfirmation) {
        navigate('/entrar', { state: { confirmationEmail: email.trim() } });
      } else {
        navigate('/onboarding', { replace: true });
      }
    } catch (caught) {
      setError(readableAuthError(caught instanceof Error ? caught.message : 'erro'));
    } finally {
      setBusy(false);
    }
  }

  const latestBirthDate = new Date();
  latestBirthDate.setFullYear(latestBirthDate.getFullYear() - 18);
  const maxDate = `${latestBirthDate.getFullYear()}-${String(latestBirthDate.getMonth() + 1).padStart(2, '0')}-${String(latestBirthDate.getDate()).padStart(2, '0')}`;

  return (
    <AuthPageFrame eyebrow="Sua próxima conexão começa aqui" title="Crie sua conta" description="Dê o primeiro passo para montar seu perfil VIRA.">
      {!configured && <div className="notice notice--warning" role="status"><strong>Supabase ainda não conectado</strong><span>O cadastro ficará disponível após configurar as variáveis indicadas no `.env.example`.</span></div>}
      <SocialAuthButtons />
      <form className="form-stack" onSubmit={(event) => void handleSubmit(event)}>
        <label className="form-field"><span>Nome de exibição</span><input autoComplete="name" minLength={2} maxLength={40} required value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Como quer ser chamado?" /></label>
        <label className="form-field"><span>Data de nascimento</span><input type="date" max={maxDate} required value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} /><small>Sua data é privada. A idade é autodeclarada; nesta fase não há verificação documental independente.</small></label>
        <label className="form-field"><span>Seu e-mail</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" /></label>
        <label className="form-field"><span>Crie uma senha</span><input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Pelo menos 8 caracteres" /><small>Use pelo menos 8 caracteres.</small></label>
        <label className="checkbox-line"><input type="checkbox" checked={acceptedAdult} onChange={(event) => setAcceptedAdult(event.target.checked)} /><span>Confirmo que tenho 18 anos ou mais.</span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button--primary button--full" type="submit" disabled={busy || !configured}>{busy ? 'Criando sua conta…' : 'Criar conta grátis'}</button>
      </form>
      <p className="auth-switch">Já tem uma conta? <Link to="/entrar">Entrar</Link></p>
    </AuthPageFrame>
  );
}

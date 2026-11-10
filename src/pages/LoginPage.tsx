import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthPageFrame } from '../components/layout/AuthPageFrame';
import { SocialAuthButtons } from '../features/auth/SocialAuthButtons';
import { useAuth } from '../features/auth/AuthContext';

interface LoginLocationState { confirmationEmail?: string; from?: string; }

export function LoginPage() {
  const { signIn, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LoginLocationState;
  const [email, setEmail] = useState(state.confirmationEmail ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(email, password);
      navigate(state.from ?? '/app', { replace: true });
    } catch {
      setError('Não foi possível entrar. Confira o e-mail e a senha ou confirme seu endereço de e-mail.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageFrame eyebrow="Que bom ter você de volta" title="Entre no VIRA" description="Acesse sua conta para continuar de onde parou.">
      {state.confirmationEmail && <div className="notice notice--success" role="status"><strong>Conta criada!</strong><span>Se a confirmação de e-mail estiver ativada, confira sua caixa de entrada em {state.confirmationEmail}.</span></div>}
      {!configured && <div className="notice notice--warning" role="status"><strong>Supabase ainda não conectado</strong><span>O login ficará disponível após configurar as variáveis indicadas no `.env.example`.</span></div>}
      <SocialAuthButtons />
      <form className="form-stack" onSubmit={(event) => void handleSubmit(event)}>
        <label className="form-field"><span>Seu e-mail</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" /></label>
        <label className="form-field"><span>Senha</span><input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" /></label>
        <p className="form-help"><Link to="/recuperar-senha">Esqueci minha senha</Link></p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button--primary button--full" type="submit" disabled={busy || !configured}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
      <p className="auth-switch">Ainda não tem uma conta? <Link to="/cadastro">Criar conta grátis</Link></p>
    </AuthPageFrame>
  );
}

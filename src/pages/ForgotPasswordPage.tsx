import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthPageFrame } from '../components/layout/AuthPageFrame';
import { useAuth } from '../features/auth/AuthContext';

export function ForgotPasswordPage() {
  const { requestPasswordReset, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch {
      setError('Não foi possível enviar o e-mail agora. Confira o endereço e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageFrame eyebrow="Acesso seguro" title="Recupere sua senha" description="Enviaremos um link para você criar uma nova senha com segurança.">
      {sent ? <div className="notice notice--success" role="status"><strong>Link enviado</strong><span>Confira sua caixa de entrada e também a pasta de spam. O link expira conforme a configuração de segurança da conta.</span></div> : <form className="form-stack" onSubmit={(event) => void handleSubmit(event)}>
        <label className="form-field"><span>Seu e-mail</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button--primary button--full" type="submit" disabled={busy || !configured}>{busy ? 'Enviando…' : 'Enviar link de recuperação'}</button>
      </form>}
      <p className="auth-switch"><Link to="/entrar">Voltar para entrar</Link></p>
    </AuthPageFrame>
  );
}

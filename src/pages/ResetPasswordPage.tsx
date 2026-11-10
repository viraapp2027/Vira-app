import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthPageFrame } from '../components/layout/AuthPageFrame';
import { useAuth } from '../features/auth/AuthContext';

export function ResetPasswordPage() {
  const { session, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !session) setError('Este link expirou ou já foi usado. Solicite um novo link de recuperação.');
  }, [loading, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password.length < 8) { setError('A nova senha deve ter pelo menos 8 caracteres.'); return; }
    if (password !== confirmation) { setError('As senhas não conferem.'); return; }
    setBusy(true);
    try {
      await updatePassword(password);
      setSaved(true);
      window.setTimeout(() => navigate('/app', { replace: true }), 1200);
    } catch {
      setError('Não foi possível atualizar a senha. Solicite um novo link e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageFrame eyebrow="Acesso seguro" title="Crie uma nova senha" description="Escolha uma senha forte para proteger sua conta VIRA.">
      {saved ? <div className="notice notice--success" role="status"><strong>Senha atualizada</strong><span>Você será levado para sua conta.</span></div> : <form className="form-stack" onSubmit={(event) => void handleSubmit(event)}>
        <label className="form-field"><span>Nova senha</span><input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" /></label>
        <label className="form-field"><span>Confirme a nova senha</span><input type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repita a nova senha" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button--primary button--full" type="submit" disabled={busy || loading || !session}>{busy ? 'Salvando…' : 'Salvar nova senha'}</button>
      </form>}
      <p className="auth-switch"><Link to="/entrar">Voltar para entrar</Link></p>
    </AuthPageFrame>
  );
}

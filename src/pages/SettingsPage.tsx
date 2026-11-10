import { LogOut, LockKeyhole, Mail, Moon, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../features/auth/AuthContext';

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <AppShell>
      <section className="app-page-heading">
        <div><span className="eyebrow">Sua conta</span><h1>Configurações</h1><p>Gerencie preferências e segurança do seu acesso ao VIRA.</p></div>
        <Settings size={30} aria-hidden="true" />
      </section>
      <div className="settings-grid">
        <section className="dashboard-card settings-card">
          <span className="eyebrow">Conta</span>
          <h2>Dados de acesso</h2>
          <div className="settings-row"><Mail size={18} aria-hidden="true" /><div><strong>E-mail</strong><span>{user?.email || 'E-mail não disponível'}</span></div></div>
          <p className="settings-note">Seu e-mail é usado para entrar e receber avisos de segurança. Ele não é exibido no seu perfil público.</p>
        </section>
        <section className="dashboard-card settings-card">
          <span className="eyebrow">Aparência</span>
          <h2>Preferência visual</h2>
          <div className="settings-row"><Moon size={18} aria-hidden="true" /><div><strong>Tema claro ou escuro</strong><span>Escolha o modo mais confortável para você.</span></div><ThemeToggle /></div>
        </section>
        <section className="dashboard-card settings-card">
          <span className="eyebrow">Segurança</span>
          <h2>Proteja seu acesso</h2>
          <div className="settings-row"><LockKeyhole size={18} aria-hidden="true" /><div><strong>Senha</strong><span>Receba um link seguro para criar uma nova senha.</span></div><Link className="button button--quiet" to="/recuperar-senha">Alterar</Link></div>
        </section>
        <section className="dashboard-card settings-card settings-card--danger">
          <span className="eyebrow">Sessão</span>
          <h2>Encerrar acesso</h2>
          <p>Use esta opção quando estiver em um dispositivo compartilhado.</p>
          <button className="button button--outline" type="button" onClick={() => void handleSignOut()}><LogOut size={17} aria-hidden="true" /> Sair da conta</button>
        </section>
      </div>
    </AppShell>
  );
}

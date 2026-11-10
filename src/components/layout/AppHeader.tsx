import { useState } from 'react';
import { Home, LogOut, Settings, UserRound } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';

export function AppHeader({ showNavigation = true }: { showNavigation?: boolean }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function handleSignOut() {
    setError('');
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch {
      setError('Não foi possível encerrar a sessão. Tente novamente.');
    }
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <Logo compact />
          {showNavigation && <nav className="desktop-app-nav" aria-label="Navegação principal">
            <NavLink to="/app" className={({ isActive }) => `app-nav-link ${isActive ? 'is-active' : ''}`}><Home size={17} aria-hidden="true" /> Início</NavLink>
            <NavLink to="/perfil" className={({ isActive }) => `app-nav-link ${isActive ? 'is-active' : ''}`}><UserRound size={17} aria-hidden="true" /> Meu perfil</NavLink>
            <NavLink to="/configuracoes" className={({ isActive }) => `app-nav-link ${isActive ? 'is-active' : ''}`}><Settings size={17} aria-hidden="true" /> Configurações</NavLink>
          </nav>}
          <div className="app-header__actions">
            {error && <span className="sign-out-error" role="alert">{error}</span>}
            <ThemeToggle />
            <button className="button button--quiet sign-out-button" type="button" onClick={() => void handleSignOut()}><LogOut size={17} aria-hidden="true" /><span>Sair</span></button>
          </div>
        </div>
      </header>
      {showNavigation && <nav className="mobile-bottom-nav" aria-label="Navegação inferior">
        <NavLink to="/app" className={({ isActive }) => `mobile-nav-link ${isActive ? 'is-active' : ''}`}><Home size={19} aria-hidden="true" /><span>Início</span></NavLink>
        <NavLink to="/perfil" className={({ isActive }) => `mobile-nav-link ${isActive ? 'is-active' : ''}`}><UserRound size={19} aria-hidden="true" /><span>Perfil</span></NavLink>
        <NavLink to="/configuracoes" className={({ isActive }) => `mobile-nav-link ${isActive ? 'is-active' : ''}`}><Settings size={19} aria-hidden="true" /><span>Conta</span></NavLink>
      </nav>}
    </>
  );
}

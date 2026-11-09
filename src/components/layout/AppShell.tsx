import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';

export function AppShell({ children, showNavigation = true }: { children: ReactNode; showNavigation?: boolean }) {
  return (
    <div className="app-frame">
      <AppHeader showNavigation={showNavigation} />
      <main className="app-main">{children}</main>
      <footer className="app-footer"><span>VIRA</span><span>Tudo começa com uma conexão.</span></footer>
    </div>
  );
}

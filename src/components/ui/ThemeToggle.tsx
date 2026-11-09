import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'dark' ? 'claro' : 'escuro';
  const Icon = theme === 'dark' ? Sun : Moon;
  return (
    <button className="icon-button theme-toggle" type="button" onClick={toggleTheme} aria-label={`Ativar modo ${nextTheme}`} title={`Ativar modo ${nextTheme}`}>
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}

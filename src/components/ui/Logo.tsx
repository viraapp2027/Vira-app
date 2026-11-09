import { Link } from 'react-router-dom';

interface LogoProps { compact?: boolean; className?: string; }

export function Logo({ compact = false, className = '' }: LogoProps) {
  return (
    <Link className={`brand-lockup ${compact ? 'brand-lockup--compact' : ''} ${className}`} to="/" aria-label="VIRA — Tudo começa com uma conexão">
      <img src="/assets/brand/vira-logo.png" alt="VIRA — Tudo começa com uma conexão" />
    </Link>
  );
}

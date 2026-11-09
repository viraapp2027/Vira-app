import type { ReactNode } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';

export function AuthPageFrame({ title, eyebrow, description, children }: { title: string; eyebrow: string; description: string; children: ReactNode }) {
  return (
    <main className="auth-page">
      <header className="auth-topbar"><Link className="back-link" to="/"><ArrowLeft size={17} aria-hidden="true" /> Voltar para início</Link><ThemeToggle /></header>
      <div className="auth-layout">
        <aside className="auth-story">
          <Logo />
          <span className="auth-story__spark"><Sparkles size={18} aria-hidden="true" /></span>
          <p className="eyebrow">Tudo começa com uma conexão</p>
          <h2>Chegue como você é.<br /><span className="gradient-text">Conecte-se de verdade.</span></h2>
          <p>Uma rede social brasileira em construção para aproximar pessoas com interesses e intenções em comum.</p>
          <div className="auth-story__glow" aria-hidden="true" />
        </aside>
        <section className="auth-card" aria-labelledby="auth-title">
          <span className="eyebrow">{eyebrow}</span>
          <h1 id="auth-title">{title}</h1>
          <p className="auth-intro">{description}</p>
          {children}
        </section>
      </div>
      <footer className="auth-footer">VIRA · Para pessoas maiores de 18 anos</footer>
    </main>
  );
}

import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';

export function NotFoundPage() {
  return (
    <main className="center-state">
      <section className="state-card">
        <Logo compact />
        <p className="eyebrow">404 · rota não encontrada</p>
        <h1>Esse caminho ainda não existe.</h1>
        <p>Volte para a página inicial e siga por uma rota disponível.</p>
        <Link className="button button--primary" to="/">Ir para o início</Link>
      </section>
    </main>
  );
}

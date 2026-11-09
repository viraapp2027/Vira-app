import { ArrowDown, ArrowRight, Check, Heart, MapPin, ShieldCheck, Sparkles, UsersRound, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { ThemeToggle } from '../components/ui/ThemeToggle';

const pillars = [
  { icon: UsersRound, label: 'Amizades reais', color: 'cyan' },
  { icon: Heart, label: 'Conexões com intenção', color: 'pink' },
  { icon: Zap, label: 'Interesses em comum', color: 'violet' },
  { icon: MapPin, label: 'Espaço com respeito', color: 'cyan' },
];

const steps = [
  { number: '01', title: 'Crie seu perfil', copy: 'Apresente-se no seu ritmo e escolha o que faz sentido para você.', status: 'Disponível na Fase 1', ready: true },
  { number: '02', title: 'Conte seus interesses', copy: 'Música, futebol, cinema, viagens — comece pelo que vocês podem ter em comum.', status: 'Disponível na Fase 1', ready: true },
  { number: '03', title: 'Descubra novas conexões', copy: 'A descoberta, os grupos e os encontros chegam em etapas, com privacidade em primeiro lugar.', status: 'Nas próximas fases', ready: false },
];

const roadmap = [
  { icon: UsersRound, title: 'Amizades', copy: 'Um jeito mais natural de encontrar gente que combina com a sua energia.', color: 'cyan' },
  { icon: Heart, title: 'Relacionamentos', copy: 'Conexões com intenção, construídas a partir de objetivos compatíveis.', color: 'pink' },
  { icon: Zap, title: 'Vira Play', copy: 'Desafios e quizzes para descobrir o que aproxima vocês.', color: 'violet' },
  { icon: MapPin, title: 'Vira Rolê e Radar', copy: 'Comunidades e planos para transformar interesses em encontros reais.', color: 'cyan' },
];

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="site-header">
        <div className="site-header__inner">
          <Logo />
          <details className="mobile-menu">
            <summary className="icon-button mobile-menu__toggle" aria-label="Abrir ou fechar menu de navegação" aria-controls="mobile-navigation">
              <span className="hamburger-icon" aria-hidden="true"><i /><i /><i /></span>
            </summary>
            <nav className="mobile-menu__panel" id="mobile-navigation" aria-label="Menu móvel">
              <a href="#inicio" onClick={(event) => { const menu = event.currentTarget.closest('details'); if (menu) menu.open = false; }}>Início</a>
              <a href="#como-funciona" onClick={(event) => { const menu = event.currentTarget.closest('details'); if (menu) menu.open = false; }}>Como funciona</a>
              <a href="#recursos" onClick={(event) => { const menu = event.currentTarget.closest('details'); if (menu) menu.open = false; }}>Recursos</a>
              <a href="#planos" onClick={(event) => { const menu = event.currentTarget.closest('details'); if (menu) menu.open = false; }}>Planos</a>
              <a href="#sobre" onClick={(event) => { const menu = event.currentTarget.closest('details'); if (menu) menu.open = false; }}>Sobre</a>
              <Link to="/entrar" onClick={(event) => { const menu = event.currentTarget.closest('details'); if (menu) menu.open = false; }}>Entrar</Link>
              <Link className="mobile-menu__signup" to="/cadastro" onClick={(event) => { const menu = event.currentTarget.closest('details'); if (menu) menu.open = false; }}>Criar conta grátis</Link>
            </nav>
          </details>
          <nav className="site-nav" aria-label="Navegação da página">
            <a className="site-nav__active" href="#inicio">Início</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#recursos">Recursos</a>
            <a href="#planos">Planos</a>
            <a href="#sobre">Sobre</a>
          </nav>
          <div className="site-header__actions">
            <ThemeToggle />
            <Link className="button button--outline header-login" to="/entrar">Entrar</Link>
            <Link className="button button--primary header-signup" to="/cadastro">Criar conta grátis</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-section" id="inicio">
          <div className="hero-grid page-container">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-pulse" /> Uma nova forma de se conectar</div>
              <h1>Conheça pessoas.<br />Faça amigos.<br /><span className="gradient-text">Viva novas histórias.</span></h1>
              <p className="hero-description">A VIRA é a rede social brasileira para transformar interesses em conexões de verdade — com mais intenção, leveza e espaço para ser você.</p>
              <div className="hero-actions">
                <Link className="button button--primary button--large" to="/cadastro">Criar conta grátis <ArrowRight size={19} aria-hidden="true" /></Link>
                <a className="button button--outline button--large" href="#como-funciona"><span className="play-mark"><ArrowDown size={15} aria-hidden="true" /></span> Como funciona</a>
              </div>
              <div className="pillar-row" aria-label="Pilares da VIRA">
                {pillars.map(({ icon: Icon, label, color }) => (
                  <div className="pillar-item" key={label}>
                    <span className={`pillar-icon pillar-icon--${color}`}><Icon size={21} aria-hidden="true" /></span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <p className="phase-note"><ShieldCheck size={16} aria-hidden="true" /> A primeira etapa já permite criar sua conta e perfil. Os recursos sociais chegam por fases.</p>
            </div>

            <div className="hero-visual" aria-label="Ilustração de duas pessoas celebrando uma nova conexão">
              <div className="hero-orbit hero-orbit--one" />
              <div className="hero-orbit hero-orbit--two" />
              <div className="hero-glow" />
              <div className="hero-image-wrap">
                <img className="hero-image" src="/assets/hero/vira-hero-people.webp" alt="Duas pessoas sorrindo, lado a lado" />
              </div>
              <div className="visual-chip visual-chip--profile"><span className="chip-dot chip-dot--cyan" /><div><strong>Seu perfil</strong><small>do seu jeito</small></div></div>
              <div className="visual-chip visual-chip--intent"><span className="chip-dot chip-dot--pink" /><div><strong>Suas intenções</strong><small>amizade, rolê ou mais</small></div></div>
              <div className="visual-chip visual-chip--privacy"><ShieldCheck size={17} aria-hidden="true" /><div><strong>Você no controle</strong><small>privacidade em primeiro lugar</small></div></div>
              <span className="sparkle sparkle--one"><Sparkles size={19} aria-hidden="true" /></span>
              <span className="sparkle sparkle--two"><Sparkles size={13} aria-hidden="true" /></span>
            </div>
          </div>
        </section>

        <section className="how-section section-wrap" id="como-funciona">
          <div className="page-container">
            <div className="section-heading">
              <span className="eyebrow">Sua jornada começa aqui</span>
              <h2>Conexões que começam <span className="gradient-text">por você.</span></h2>
              <p>Um primeiro passo simples. O resto, a gente constrói junto e com cuidado.</p>
            </div>
            <div className="steps-grid">
              {steps.map((step) => (
                <article className={`step-card ${step.ready ? 'step-card--ready' : ''}`} key={step.number}>
                  <span className="step-number">{step.number}</span>
                  <span className={`step-status ${step.ready ? 'step-status--ready' : ''}`}><span />{step.status}</span>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="screen-preview-section section-wrap" aria-labelledby="preview-heading">
          <div className="page-container">
            <div className="section-heading">
              <span className="eyebrow">Fase 1 · prévia visual</span>
              <h2 id="preview-heading">Um começo com <span className="gradient-text">espaço para você.</span></h2>
              <p>As primeiras telas são para criar sua conta, escolher o que quer compartilhar e cuidar do seu perfil.</p>
            </div>
            <div className="screen-preview-rail">
              <article className="mini-screen" aria-label="Prévia visual da tela de cadastro">
                <div className="mini-screen__top"><img src="/assets/brand/vira-logo.png" alt="" /><span>PRÉVIA · CADASTRO</span></div>
                <h3>Crie sua conta</h3>
                <div className="mini-field"><small>Nome de exibição</small><span>Como quer ser chamado?</span></div>
                <div className="mini-field"><small>Data de nascimento</small><span>Privada · somente para validar 18+</span></div>
                <div className="mini-field"><small>E-mail</small><span>Seu endereço de acesso</span></div>
                <div className="mini-screen__footer"><span className="mini-badge">18+</span><span>Uma conta, no seu tempo</span></div>
              </article>
              <article className="mini-screen" aria-label="Prévia visual do onboarding de perfil">
                <div className="mini-screen__top"><img src="/assets/brand/vira-logo.png" alt="" /><span>PRÉVIA · ONBOARDING</span></div>
                <h3>Conte o que importa</h3>
                <div className="mini-field"><small>Onde você está?</small><span>Sua cidade · Seu estado</span></div>
                <p className="mini-caption">Interesses para escolher</p>
                <div className="mini-chip-row"><span>Música</span><span>Games</span><span>Viagens</span></div>
                <p className="mini-caption">Escolha uma ou mais intenções</p>
                <div className="mini-chip-row mini-chip-row--accent"><span>Amizades</span><span>Comunidades</span></div>
              </article>
              <article className="mini-screen" aria-label="Prévia visual do perfil pessoal">
                <div className="mini-screen__top"><img src="/assets/brand/vira-logo.png" alt="" /><span>PRÉVIA · MEU PERFIL</span></div>
                <div className="mini-profile-head"><span className="mini-avatar">V</span><div><strong>Seu nome</strong><small>Sua cidade, UF</small></div></div>
                <div className="mini-divider" />
                <p className="mini-caption">Sobre mim</p>
                <div className="mini-field"><span>Biografia opcional</span></div>
                <p className="mini-caption">Seu perfil inclui</p>
                <div className="mini-screen__footer"><span>Interesses</span><span>Intenções</span><span>Privacidade</span></div>
              </article>
            </div>
            <p className="screen-preview-note">Prévia visual da Fase 1; sem dados de usuários reais nem ações ilustrativas.</p>
          </div>
        </section>

        <section className="features-section section-wrap" id="recursos">
          <div className="page-container">
            <div className="section-heading section-heading--row">
              <div><span className="eyebrow">O que move a VIRA</span><h2>Mais afinidade.<br /><span className="gradient-text">Menos acaso.</span></h2></div>
              <p>Uma visão social feita para aproximar pessoas por interesses, objetivos e comunidades — liberada com transparência, etapa por etapa.</p>
            </div>
            <div className="feature-grid">
              {roadmap.map(({ icon: Icon, title, copy, color }) => (
                <article className="feature-card" key={title}>
                  <span className={`feature-icon feature-icon--${color}`}><Icon size={21} aria-hidden="true" /></span>
                  <span className="planned-tag">Planejado</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
            <p className="roadmap-note"><Check size={16} aria-hidden="true" /> Nesta primeira fase, o que já funciona é criar sua conta, completar e editar o perfil.</p>
          </div>
        </section>

        <section className="plans-section section-wrap" id="planos">
          <div className="page-container">
            <div className="section-heading">
              <span className="eyebrow">Acesso transparente</span>
              <h2>Uma base gratuita.<br /><span className="gradient-text">Planos sem surpresa.</span></h2>
              <p>Os valores abaixo são a proposta do produto. Não há cobranças reais nesta etapa de validação.</p>
            </div>
            <div className="plans-grid">
              <article className="plan-card">
                <div className="plan-topline"><span>VIRA</span><span className="plan-label">Disponível para começar</span></div>
                <h3>Free</h3><p className="plan-price">R$ 0 <small>para sempre</small></p>
                <p className="plan-copy">Crie sua conta e monte seu perfil sem custo.</p>
                <ul><li><Check size={16} /> Cadastro e perfil</li><li><Check size={16} /> Interesses e intenções</li><li><Check size={16} /> Controle das suas informações</li></ul>
                <Link className="button button--outline plan-button" to="/cadastro">Criar conta grátis <ArrowRight size={17} /></Link>
              </article>
              <article className="plan-card plan-card--premium">
                <div className="plan-topline"><span className="premium-word">VIRA PREMIUM</span><span className="plan-label plan-label--future">Proposta em validação</span></div>
                <h3>Premium</h3><p className="plan-price">R$ 19,90 <small>/ mês · valor proposto</small></p>
                <p className="plan-copy">Mais opções para personalizar sua experiência, quando os recursos forem lançados.</p>
                <ul><li><Check size={16} /> Recursos avançados planejados</li><li><Check size={16} /> Sem cobrança durante a validação</li><li><Check size={16} /> Nenhuma assinatura ativa nesta fase</li></ul>
                <span className="button button--muted plan-button" aria-label="Plano Premium ainda não disponível">Ainda não disponível</span>
              </article>
            </div>
          </div>
        </section>

        <section className="about-section section-wrap" id="sobre">
          <div className="page-container about-card">
            <span className="about-symbol"><UsersRound size={28} aria-hidden="true" /></span>
            <div><span className="eyebrow">Uma rede feita para a vida real</span><h2>Tudo começa com <span className="gradient-text">uma conexão.</span></h2><p>A VIRA nasceu para aproximar pessoas que talvez ainda não tenham se encontrado — com interesses em comum, escolhas claras e respeito ao seu espaço.</p></div>
            <Link className="button button--primary" to="/cadastro">Fazer parte <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        </section>
      </main>

      <footer className="site-footer page-container"><Logo compact /><p>© {new Date().getFullYear()} VIRA. Tudo começa com uma conexão.</p><a href="#inicio">Voltar ao topo ↑</a></footer>
    </div>
  );
}

# Plano de implementação — VIRA, Fase 1

## Objetivo da fase

Criar do zero a fundação real do VIRA e sua primeira jornada útil: apresentação da plataforma, cadastro/login, verificação de maioridade e criação/edição de perfil persistido no Supabase. A experiência deve funcionar em dispositivos móveis e desktop, respeitar a identidade do logo fornecido e deixar a estrutura organizada para as fases sociais seguintes.

Esta fase não simulará funcionalidades ainda não implementadas. Match, chat, Vira Play, Radar, Rolês, comunidades, assinaturas e pagamentos ficam para fases futuras; a interface não apresentará botões falsos para elas.

## Arquitetura e abordagem

- **Frontend:** React, TypeScript, Vite, Tailwind CSS e React Router, em aplicação SPA responsiva.
- **Autenticação e dados:** Supabase Auth e PostgreSQL. O cliente usa somente a chave pública/anon do Supabase; segredos privilegiados nunca serão incluídos no bundle do navegador.
- **Persistência e segurança:** migrations SQL versionadas para perfis e dados de onboarding; Row Level Security restringe leitura e alteração dos dados privados ao próprio usuário. A UI não usará armazenamento local como substituto do banco.
- **Validação etária:** formulário exige nascimento compatível com 18 anos ou mais; validações correspondentes no banco impedem criar/atualizar perfil de menor. A data de nascimento não será exibida publicamente.
- **Localização e privacidade:** perfil inicial trabalha apenas com cidade e estado, sem coordenadas ou endereço exato. Preferências e dados pessoais não serão expostos por políticas públicas genéricas.
- **Hospedagem prevista:** aplicação Vite compilada para um Static Site no Render; Supabase fornece Auth e PostgreSQL nesta fase. O projeto terá `.env.example`, sem chaves reais. Configuração de domínio, credenciais e publicação serão feitas quando disponíveis/autorizadas. Funções privilegiadas futuras devem usar um ambiente de servidor seguro ou Supabase Edge Functions, nunca a chave `service_role` no frontend.
- **Repositório:** começar com código novo para o repositório indicado pelo usuário; não presumir que há conteúdo existente. Nenhum segredo será commitado. A publicação em produção não faz parte desta aprovação de implementação.

## Estrutura prevista

```text
public/
  manus-routes.json      # manifesto das rotas da aplicação
src/
  app/                   # bootstrap e configuração de rotas
  components/
    layout/              # cabeçalho, navegação inferior, estrutura autenticada
    ui/                  # botões, campos, cartões, estados e feedbacks
  features/
    auth/                # cadastro, login e sessão
    profile/             # onboarding, edição e apresentação do perfil
  pages/                 # landing, autenticação, início e perfil
  lib/
    supabase/            # cliente tipado e configuração por ambiente
    validation/          # regras compartilhadas e validações de formulários
  styles/                # tokens, tema claro/escuro e estilos globais
  types/                 # tipos de domínio e respostas
supabase/
  migrations/            # esquema, políticas RLS, funções/validações SQL
.env.example
README.md
```

## Design e identidade visual

- **Direção:** seguir o clima da referência fornecida — social, vibrante e noturno — com fundo azul-marinho profundo, luzes violeta/ciano/magenta e o logo oficial intacto. A composição será reinterpretada para a VIRA, não copiada.
- **Princípios:** identidade expressiva com leitura clara; foco em conexões humanas; segurança e privacidade evidentes; interface mobile-first consistente e acessível.
- **Paleta:** roxo como cor proprietária; rosa/magenta em chamadas e contextos de afeto; ciano associado a amizade e conexão; azul-marinho para dar profundidade à landing. Gradientes ecoam o logo sem alterar o arquivo. Contraste legível nos modos escuro e claro.
- **Layout:** navegação superior com âncoras reais para seções da landing; hero editorial assimétrico com texto/CTAs à esquerda e arte original à direita no desktop, empilhado em celular; faixa inferior apresentando somente as jornadas existentes de cadastro, onboarding e perfil.
- **Elementos distintivos:** anéis de luz/conexão, chips informativos arredondados e CTAs em gradiente magenta-violeta. Se recursos futuros forem mencionados, serão claramente informativos, não clicáveis e marcados como planejados; não haverá mockups que afirmem funcionalidade inexistente.
- **Interação e movimento:** estados explícitos de carregamento, sucesso, erro e vazio; retorno visual em ações; transições curtas e suaves; respeito a `prefers-reduced-motion` e navegação por teclado.
- **Tipografia:** Manrope em títulos e Inter em textos e controles, com hierarquia legível e fallback de sistema.
- **Essência da marca:** uma rede social brasileira para adultos transformarem interesses em conexões; personalidade vibrante, próxima e segura.
- **Tom de voz:** direto, caloroso e sem pressão. Exemplos: “Tudo começa com uma conexão.” e “Conte um pouco sobre você — no seu ritmo.”
- **Wordmark e logo:** usar o PNG oficial anexado como ativo da marca e manter o nome VIRA fiel à arte; não criar uma versão substituta em fonte padrão.
- **Cor proprietária:** roxo VIRA, derivado visualmente do logo; rosa e ciano atuam como cores complementares sem competir com o roxo.

## Resultados desta fase

1. **Fundação do aplicativo:** estrutura React/TypeScript/Vite/Tailwind/Router, comandos de desenvolvimento e build, manifesto de rotas, documentação de configuração e ambiente de exemplo.
2. **Experiência inicial responsiva:** landing page VIRA com logo oficial, slogan e chamadas reais para cadastro/login; áreas pública e autenticada com navegação adequada a celular e desktop; modo claro/escuro, acessibilidade e estados de interface.
3. **Autenticação:** cadastro e login por e-mail/senha via Supabase Auth, encerramento de sessão e rotas protegidas, com feedback de carregamento/erro/sucesso.
4. **Onboarding e perfil persistidos:** coleta de nome de exibição, data de nascimento (somente para validar/exibir idade calculada), cidade, estado, biografia opcional, interesses e intenções; edição do próprio perfil e tela inicial com resumo dos dados salvos.
5. **Banco e segurança:** migrations versionadas para os dados da fase, regras RLS e validação de maioridade; acesso negado por padrão a perfis privados de terceiros. Não haverá uso de `localStorage` para substituir autenticação ou persistência no banco.

## Fora do escopo desta fase

Implementação completa de matches e descoberta, mensagens em tempo real, desafios Vira Play, Radar geográfico, Rolês, comunidades, moderação, denúncias, limites Free/Premium, assinaturas, publicidade, pagamentos, estatísticas avançadas e recursos de IA. Esses módulos serão planejados em fases próprias, usando a fundação agora criada.

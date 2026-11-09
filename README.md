# VIRA

Rede social brasileira em desenvolvimento. Esta Fase 1 entrega a base de identidade, cadastro/login, onboarding e perfil privado persistido no Supabase.

## Requisitos

- Node.js 22.23.4 (ou compatível com o Vite instalado)
- pnpm 11.25.0
- Projeto Supabase para Auth e PostgreSQL

## Desenvolvimento local

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em `.env.local` com os valores públicos do seu projeto Supabase. O arquivo `.env.local` é ignorado pelo Git. Nunca coloque uma chave `service_role` em variáveis `VITE_` ou em arquivos consumidos pelo navegador.

Sem essas variáveis, a landing continua visível e as páginas de autenticação informam claramente que o serviço ainda não foi configurado; não há login ou banco simulado.

## Configuração do Supabase

1. Crie ou selecione um projeto Supabase e habilite autenticação por e-mail/senha.
2. No **SQL Editor**, aplique, em ordem, os arquivos de `supabase/migrations/`.
3. Em **Authentication → URL Configuration**, configure o domínio de produção no Render como Site URL e adicione as URLs de desenvolvimento/Preview autorizadas como Redirect URLs.
4. No desenvolvimento local, use a URL do projeto e a chave pública/anon no `.env.local`. O cliente usa fluxo PKCE e mantém os dados de perfil no PostgreSQL; armazenamento local é usado somente pelo mecanismo de sessão do Supabase e pela preferência de tema.
5. A migration cria perfil após o cadastro, valida maioridade no banco e aplica RLS. Na Fase 1, um usuário só pode ler e editar o próprio perfil. Não aplique políticas públicas de leitura de perfis.

## Render

O `render.yaml` descreve a publicação estática da SPA, o fallback de rotas do React Router e as variáveis exigidas durante o build. Após configurar no serviço Render `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, o build é `pnpm install --frozen-lockfile && pnpm build`, com diretório publicado `dist`.

O blueprint é preparatório. A publicação e a aplicação das migrations em produção não foram executadas nesta fase.

## Estrutura

- `src/app`: roteamento e proteção das rotas.
- `src/features/auth`: autenticação Supabase.
- `src/features/profile`: onboarding, interesses, intenções e edição do perfil.
- `src/components`: navegação, tema, estados e componentes reutilizáveis.
- `src/lib/supabase`: cliente de banco/autenticação.
- `supabase/migrations`: esquema SQL e políticas RLS versionadas.
- `public/manus-routes.json`: manifesto das rotas públicas da interface.

## Comandos

```bash
pnpm dev        # Vite em 0.0.0.0:3000 para o Preview
pnpm typecheck  # diagnósticos TypeScript
pnpm build      # typecheck e bundle estático em dist/
```

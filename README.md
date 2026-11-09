# VIRA

Rede social brasileira em desenvolvimento. A Fase 1 entrega identidade visual, cadastro/login, onboarding e perfil privado persistido no Supabase; esta extensão prepara login social Google/Facebook e fotos de perfil.

## Requisitos

- Node.js 22.23.4 (ou compatível com o Vite instalado)
- pnpm 11.25.0
- Projeto Supabase para Auth, PostgreSQL e Storage

## Desenvolvimento local

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em `.env.local` com os valores públicos do seu projeto Supabase. O arquivo `.env.local` é ignorado pelo Git. Nunca coloque uma chave `service_role`/secret em variáveis `VITE_*` ou em arquivos consumidos pelo navegador.

Sem essas variáveis, a landing continua visível e as páginas de autenticação informam claramente que o serviço ainda não foi configurado; não há login ou banco simulado.

## Configuração do Supabase

1. Crie ou selecione o projeto Supabase e habilite autenticação por e-mail/senha.
2. Aplique, em ordem, os arquivos de `supabase/migrations/`. Para contas Google/Facebook, complete o onboarding e informe a data de nascimento privada.
3. O limite de 18 anos é baseado na data informada e em uma autodeclaração afirmativa. O banco registra a declaração, seu horário de gravação e a versão do texto — no cadastro por e-mail ou ao salvar a confirmação do onboarding social/legado — e bloqueia a alteração da data/revogação depois da conclusão. **Esta fase não faz verificação independente de identidade ou idade por documento e não prova que a data declarada é verdadeira.** Um perfil concluído anterior à migration de declaração será preservado; seu titular verá a confirmação uma vez na próxima entrada.
4. Em **Authentication → URL Configuration**, configure o domínio ativo como Site URL e adicione Redirect URLs exatos:
   - `https://vira-cr5vxix7.manus.space/auth/callback`
   - `https://8328-imfejuxl072isgpvi2r95-708c8afa.us5.manus.computer/auth/callback`
   - `https://vira.onrender.com/auth/callback`
   - `http://localhost:3000/auth/callback`
5. Para Google, crie um OAuth Client do tipo Web na Google Auth Platform. Adicione as origens ativas da VIRA em **Authorized JavaScript origins** (`https://vira-cr5vxix7.manus.space`, `https://8328-imfejuxl072isgpvi2r95-708c8afa.us5.manus.computer`, `https://vira.onrender.com` e `http://localhost:3000`); em **Authorized redirect URIs**, adicione exatamente `https://bcrjygubveuummfzpcfi.supabase.co/auth/v1/callback`. Habilite os escopos de identidade, e-mail e perfil (`openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`).
6. Para Facebook, crie um app em Meta for Developers, habilite Facebook Login, as permissões `public_profile` e `email`, e adicione exatamente `https://bcrjygubveuummfzpcfi.supabase.co/auth/v1/callback` em **Valid OAuth Redirect URIs**.
7. Em **Authentication → Sign In / Providers**, habilite Google/Facebook e informe o Client ID/Secret do Google e o App ID/Secret do Facebook. Esses segredos ficam somente no Supabase Auth; não os envie por chat, não os coloque no Render/frontend e não os versione.
8. A migration cria o bucket privado `vira-avatars`, aceita JPEG/PNG/WebP até 5 MiB e limita leitura/escrita ao usuário dono. Depois do onboarding e da autodeclaração de 18+, a foto social é importada automaticamente pela Edge Function autenticada `import-provider-avatar`; em Editar perfil, a pessoa pode pré-visualizar a nova imagem e confirmar antes de substituir a foto atual. O upload passa por `upload-profile-avatar`, que valida sessão, maioridade declarada, limite total do corpo e assinatura dos bytes da imagem; o objeto anterior só é removido após atualizar o perfil com sucesso.
9. URLs da foto são assinadas por 10 minutos e renovadas a cada 8 minutos e quando a pessoa volta ao app. Fotos ficam privadas nesta fase; políticas de leitura para outras pessoas devem ser decididas junto ao módulo social futuro.
10. As origens CORS permitidas pelas funções são exatas: `https://vira-cr5vxix7.manus.space`, `https://8328-imfejuxl072isgpvi2r95-708c8afa.us5.manus.computer`, `https://vira-app-9ajn.onrender.com`, `https://vira.onrender.com`, `http://localhost:3000`, `http://127.0.0.1:3000`, `http://localhost:5173` e `http://127.0.0.1:5173`. Para um domínio personalizado, inclua a origem HTTPS exata em ambas as funções antes de usar; não use curingas.
11. No desenvolvimento local, use a URL do projeto e a chave publicável/anon no `.env.local`. O navegador armazena a sessão gerenciada pelo Supabase e a preferência de tema; os dados do perfil são persistidos no PostgreSQL.

A callback do projeto para configurar nos consoles Google e Facebook é `https://bcrjygubveuummfzpcfi.supabase.co/auth/v1/callback`. O código dos botões e o banco estão preparados, mas a autenticação social só funcionará depois de habilitar ambos os provedores com credenciais próprias no Supabase Auth.

## Render

O `render.yaml` descreve a publicação estática da SPA, o fallback de rotas do React Router e as variáveis exigidas durante o build. Após configurar no serviço Render `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, o build é `pnpm install --frozen-lockfile && pnpm build`, com diretório publicado `dist`.

A publicação do novo código não é automática durante esta alteração. OAuth só conclui o fluxo quando os provedores e as URLs de redirecionamento estiverem configurados no Supabase e nos consoles externos.

## Estrutura

- `src/app`: roteamento e proteção das rotas.
- `src/features/auth`: autenticação Supabase por e-mail/senha e provedores OAuth.
- `src/features/profile`: onboarding, interesses, intenções, foto e edição do perfil.
- `src/components`: navegação, tema, estados e componentes reutilizáveis.
- `src/lib/supabase`: cliente de banco/autenticação.
- `supabase/migrations`: esquema SQL, Storage e políticas RLS versionadas.
- `supabase/functions/import-provider-avatar`: importação segura da foto social.
- `supabase/functions/upload-profile-avatar`: upload manual e substituição com validação dos bytes no servidor.
- `public/manus-routes.json`: manifesto das rotas da interface.

## Comandos

```bash
pnpm dev        # Vite em 0.0.0.0:3000 para o Preview
pnpm typecheck  # diagnósticos TypeScript
pnpm build      # typecheck e bundle estático em dist/
```

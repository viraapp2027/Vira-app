# Plano de implementação — VIRA, Fase 1 e extensão de autenticação/fotos

## Objetivo

Manter a Fase 1 aprovada da VIRA — apresentação, cadastro/login, barreira declaratória de 18 anos e perfil persistido no Supabase — e incorporar a solicitação adicional de login social com Google e Facebook, importação automática da foto do provedor e troca manual da imagem do perfil. A aplicação permanece mobile-first, em pt-BR, com a identidade visual previamente aprovada. Os demais módulos sociais continuam planejados para fases futuras.

## Arquitetura e abordagem

- **Frontend:** React, TypeScript, Vite, Tailwind CSS e React Router, mantendo a SPA existente e carregamento responsivo.
- **Autenticação:** Supabase Auth com e-mail/senha, Google e Facebook. Os botões sociais usam `supabase.auth.signInWithOAuth`, preservam a sessão Supabase existente e retornam à rota `/auth/callback`. Login e cadastro compartilham os mesmos provedores. Erros, cancelamento e provedor ainda não habilitado recebem feedback claro. Google/Facebook não fornecem a data de nascimento necessária; a conta social incompleta segue para onboarding privado e não acessa a área autenticada até que a pessoa informe a data de nascimento e marque a autodeclaração de que tem 18 anos ou mais.
- **Credenciais OAuth externas:** cada provedor precisa de seu próprio OAuth Client ID/Client Secret (Google) ou App ID/App Secret (Meta/Facebook) configurado no Supabase Auth. Os segredos ficam exclusivamente na configuração do Supabase, nunca em código, variáveis `VITE_*` ou Git. A ativação ponta a ponta aguarda essas credenciais.
- **Redirecionamentos e CORS:** registrar nos consoles Google/Facebook a callback `https://bcrjygubveuummfzpcfi.supabase.co/auth/v1/callback`. Incluir no Supabase Auth os Redirect URLs exatos para o site, Preview e desenvolvimento local. As Edge Functions aceitam somente estas origens exatas: `https://vira-cr5vxix7.manus.space`, `https://8328-imfejuxl072isgpvi2r95-708c8afa.us5.manus.computer`, `https://vira.onrender.com`, `http://localhost:3000`, `http://127.0.0.1:3000`, `http://localhost:5173` e `http://127.0.0.1:5173`; sem curingas. Se outro domínio for configurado, adicionar sua origem HTTPS exata antes de publicar.
- **Idade e declaração:** a barreira desta fase é autodeclaratória: rejeitar a data informada se indicar idade abaixo de 18, exigir confirmação explícita e registrar no banco a aceitação, horário de gravação e versão do texto. O trigger registra a data no cadastro por e-mail e ao salvar o onboarding social/legado. Isso não comprova identidade nem idade real; verificação independente por documento ou serviço externo não faz parte desta etapa. Depois de concluído o onboarding, a data e o registro de declaração não podem ser alterados.
- **Dados e perfil:** novos perfis ficam incompletos (`date_of_birth = NULL`, `onboarding_completed = false`) somente durante onboarding. O banco exige data declarada de pessoa adulta e autodeclaração registrada antes de concluir; depois da conclusão, impede alterar a data ou reverter o indicador de onboarding. A data de nascimento permanece privada. Um perfil antigo que já esteja concluído mas não tenha registro da autodeclaração mantém todos os seus dados e terá o acesso encaminhado para uma única confirmação, sem resetar o onboarding nem apagar o perfil.
- **Foto automática:** após autenticação social e onboarding, a Edge Function `import-provider-avatar` recebe JWT do próprio usuário, valida a sessão, lê metadados apenas para apresentação, segue no máximo três redirecionamentos HTTPS em hosts aprovados, limita tempo/tamanho/tipo e verifica assinatura dos bytes antes de salvar no bucket privado. Só importa se o perfil ainda não tiver foto; atualização condicional e remoção do objeto concorrente evitam sobrescrita. Nenhuma chave `service_role` é usada.
- **Troca manual:** a tela de edição disponibiliza escolha de arquivo, prévia, carregamento e erros acessíveis. Aceitar JPEG, PNG ou WebP, até 5 MiB; `upload-profile-avatar` valida sessão, onboarding, tamanho total do corpo multipart até 5,25 MiB mesmo sem `Content-Length` confiável e assinatura real dos bytes. Cada arquivo usa caminho novo e único; o banco compara o `avatar_path` anterior para evitar corrida, salva o novo caminho e só então remove a foto antiga. Em caso de falha/conflito, remove somente o novo objeto.
- **Storage e privacidade:** bucket privado `vira-avatars`; nesta fase, somente o dono autenticado pode ler, enviar ou remover seus objetos. O app usa URL assinada por 10 minutos e a renova antes de expirar enquanto a sessão está ativa. Fotos não entram no Git nem no bundle estático; a leitura por outros usuários fica para o módulo social futuro.
- **Segredos:** a chave publicável/anon permanece no cliente protegida por RLS. Nenhuma chave privilegiada é exposta; ambas as Edge Functions usam JWT do usuário e policies Storage/Database.
- **Hospedagem:** o site continua um build estático Vite em Render/Manus; funções e dados pertencem ao Supabase. Esta solicitação não publica automaticamente a nova versão em produção.

## Estrutura relevante

```text
src/
  features/auth/                 # sessão Supabase, e-mail/senha e provedores OAuth
  features/profile/              # onboarding, avatar, edição e perfil
  components/ui/                  # controles e estados acessíveis
  pages/                          # landing, cadastro, login, callback e perfil
  lib/supabase/                   # cliente Supabase do navegador
supabase/
  migrations/                     # perfil, autodeclaração etária, avatar e policies RLS
  functions/import-provider-avatar/
    index.ts                      # importação segura da foto social
    deno.json                     # dependências/configuração do runtime
  functions/upload-profile-avatar/
    index.ts                      # upload/substituição com validação server-side
    deno.json                     # dependências/configuração do runtime
public/manus-routes.json          # manifesto sincronizado com as rotas reais
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

## Resultados

1. **Fundação do aplicativo:** estrutura React/TypeScript/Vite/Tailwind/Router, comandos de desenvolvimento e build, manifesto de rotas, documentação de configuração e ambiente de exemplo.
2. **Experiência inicial responsiva:** landing page VIRA com logo oficial, slogan e chamadas reais para cadastro/login; áreas pública e autenticada com navegação adequada a celular e desktop; modo claro/escuro, acessibilidade e estados de interface.
3. **Autenticação:** cadastro/login por e-mail/senha e Google/Facebook via Supabase Auth, saída de sessão, callback PKCE e rotas protegidas, com carregamento e erros claros; OAuth aguarda credenciais próprias de cada provedor.
4. **Onboarding e perfil persistidos:** nome de exibição, data de nascimento privada, cidade, estado, biografia opcional, interesses, intenções e edição do próprio perfil; autodeclaração de idade registrada, barreira para data informada abaixo de 18 e imutabilidade depois da conclusão.
5. **Fotos do perfil:** importação automática da imagem Google/Facebook depois do onboarding, somente quando ainda não houver foto; upload manual, troca por caminho único, validação server-side, URLs assinadas de 10 minutos e RLS por usuário dono nesta fase.
6. **Banco e segurança:** migrations SQL versionadas, policies RLS de perfis e Storage, bucket privado, autodeclaração etária, imutabilidade de nascimento e duas Edge Functions autenticadas sem `service_role`.

## Fora do escopo

Implementação completa de matches e descoberta, mensagens em tempo real, desafios Vira Play, Radar geográfico, Rolês, comunidades, moderação, denúncias, limites Free/Premium, assinaturas, publicidade, pagamentos, estatísticas avançadas, recursos de IA e verificação independente de idade/documento. O compartilhamento das fotos com outros usuários ficará sujeito à política de privacidade a definir quando a descoberta social for implementada.

## Referências técnicas oficiais consultadas

- Google OAuth: https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- Facebook OAuth: https://supabase.com/docs/guides/auth/social-sign-in/auth-facebook
- Metadados de usuários/identidades: https://supabase.com/docs/guides/auth/users
- Autorização de Edge Functions: https://supabase.com/docs/guides/functions/auth
- Escolha do pacote server para bearer JWT: https://supabase.com/docs/guides/auth/choosing-a-server-package
- Policies do Supabase Storage: https://supabase.com/docs/guides/storage/security/access-control

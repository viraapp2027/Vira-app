# VIRA — resultados e critérios de aceitação

Este backlog preserva o escopo mestre da plataforma. A Fase 1 aprovada está indicada nos itens 1–4, com a extensão solicitada de OAuth e fotos nos itens 13–14; os módulos posteriores permanecem abertos, sem serem apresentados como funcionalidades prontas.

## 1. [Fase 1 — base implementada; Preview e build verificados] Fundação técnica, identidade e configuração

- O VIRA é uma rede social de entretenimento, amizades, relacionamentos e comunidades para pessoas maiores de 18 anos, começando pelo Brasil, em português brasileiro (pt-BR), com valores comerciais em reais (BRL).
- O slogan da marca é “Tudo começa com uma conexão.”
- Utilizar obrigatoriamente o logo oficial anexado, preservando a arte original.
- Roxo é a cor principal; rosa representa relacionamentos e matches; ciano representa amizades e conexões. Usar elementos arredondados, tipografia moderna, animações suaves e visual jovem, atraente e profissional, sem copiar marcas, layouts proprietários ou elementos exclusivos de concorrentes.
- Implementar design mobile-first e responsivo, modo claro e modo escuro, navegação inferior no celular, feedback visual em interações implementadas, estados de carregamento, tratamento de erros, telas vazias bem desenvolvidas e acessibilidade.
- Usar React, TypeScript, Vite, Tailwind CSS e React Router, com arquitetura modular, escalável, organizada, tipada e preparada para manutenção.
- Preparar documentação, scripts de build, estrutura de ambiente, `.env.example` e instruções de implantação compatíveis com Render. Preparar Supabase Auth/PostgreSQL e não substituir o banco real por armazenamento local do navegador.
- Usar planos gratuitos sempre que possível e preparar integrações externas posteriores; não incluir chaves secretas em código versionado nem efetuar cobrança real durante a validação.
- Não apresentar botões ilustrativos nem alegar que módulos futuros estão implementados.

## 2. [Fase 1 — experiência inicial implementada; Preview e build verificados] Apresentação e experiência inicial

- Criar a página pública inicial da VIRA em pt-BR, com logo oficial, slogan e acesso real às jornadas de cadastro e login.
- Apresentar a proposta da plataforma sem sugerir que funcionalidades sociais ainda não entregues já estão disponíveis.
- As áreas pública e autenticada devem ser responsivas, adequadas a celular e desktop, com navegação correspondente somente às páginas existentes.
- Implementar modo claro/escuro, feedbacks, carregamento, erros e estados vazios nas jornadas entregues; garantir leitura, foco visível, operação por teclado e movimento reduzido quando solicitado pelo sistema.

## 3. [Fase 1 — autodeclaração registrada no banco; Google/Facebook aguardam credenciais externas] Supabase Auth, maioridade e sessão

- Implementar cadastro, login e saída de sessão reais por Supabase Auth.
- Usar barreira etária baseada na data de nascimento informada e em um checkbox afirmativo explícito de 18 anos ou mais. Registrar a autodeclaração, o horário definido pelo banco e a versão do texto no cadastro por e-mail ou ao salvar o onboarding social/legado; impedir alteração da data/revogação da declaração depois da conclusão.
- Esta etapa não faz verificação independente de identidade/idade por documento e não prova a veracidade da data autodeclarada; não afirmar que detecta quem informa idade falsa.
- Preservar o perfil concluído que existia antes do registro da declaração e solicitar ao titular uma confirmação única na próxima entrada, sem apagar os demais dados.
- A data de nascimento é privada e não deve ser exibida publicamente; a idade, quando mostrada, é derivada dela.
- Usar exclusivamente a chave pública/anon no frontend. Não expor nem versionar a chave `service_role` ou outras credenciais privilegiadas.
- Aplicar rotas protegidas e estados claros para sessão ausente, carregamento, falha de autenticação e saída.

## 4. [Fase 1 — schema/RLS e funções aplicados; aguarda teste real da conta] Onboarding, perfil e proteção de dados

- Permitir que o usuário informe nome de exibição, data de nascimento, cidade, estado, biografia opcional, interesses e uma ou várias intenções na plataforma.
- As intenções disponíveis são: fazer amizades; procurar relacionamento; encontrar companhia para passeios; participar de comunidades.
- Persistir perfil e dados de onboarding no PostgreSQL/Supabase; permitir visualizar e editar o próprio perfil.
- Não exibir localização exata; na Fase 1, trabalhar apenas com cidade e estado. A data de nascimento permanece privada.
- Criar migrations SQL versionadas e regras Row Level Security para proteger dados pessoais; restringir leitura/alteração do perfil privado ao usuário autorizado. Não usar armazenamento local do navegador como substituto do banco.
- Interesses/intenções coletados nesta etapa devem ficar disponíveis para módulos futuros sem simular descoberta, match ou comunicação ainda não implementados.

## 5. [Fase futura — em aberto] Vira Play — desafios virais

- Oferecer tipos de desafio: “Quem me conhece melhor?”, teste de amizade, teste de casal, desafio de compatibilidade, perguntas engraçadas, duelos de opiniões, batalha de grupos, quiz personalizado e desafios coletivos.
- Permitir criar desafios; selecionar perguntas; personalizar respostas; definir respostas corretas quando aplicável; compartilhar links; convidar amigos; participar; consultar resultados; visualizar rankings; consultar histórico.
- Cada desafio deve possuir identificador exclusivo.
- O compartilhamento deve funcionar por WhatsApp, Instagram, Telegram e outros meios compatíveis, usando mecanismos nativos de compartilhamento do dispositivo e links copiáveis quando necessário.
- Criar páginas públicas de prévia dos desafios.
- Inicialmente usar perguntas predefinidas, sem depender de serviço pago de IA.
- Free: criar um desafio por dia. Premium: criar desafios sem limite diário de produto para uso normal, respeitando controles contra abuso. Ambos os planos podem participar gratuitamente dos desafios públicos disponíveis.

## 6. [Fase futura — em aberto] Vira Match — descoberta e conexões

- No cadastro/perfil, permitir selecionar uma ou várias intenções: fazer amizades, procurar relacionamento, encontrar companhia para passeios e participar de comunidades.
- Perfil do usuário: nome de exibição, idade, cidade, estado, fotos, biografia, interesses, preferências, objetivos na plataforma e configurações de privacidade.
- Calcular afinidade considerando interesses em comum, preferências declaradas, objetivos compatíveis, faixa etária, região aproximada e respostas opcionais a desafios.
- Explicar como o percentual de afinidade foi calculado e deixar claro que não garante compatibilidade.
- Implementar curtir perfil, passar perfil, match mútuo, lista de matches, remover conexão, bloquear usuário, denunciar perfil e filtros de descoberta.
- As intenções das duas pessoas precisam ser compatíveis. Usuários interessados somente em amizade não devem receber solicitações românticas.
- Free: 20 curtidas por dia. Premium: curtidas sem limite diário de produto para uso normal, com controles contra automação e abuso.

## 7. [Fase futura — em aberto] Vira Chat — mensagens privadas

- Permitir conversas somente entre usuários mutuamente conectados.
- Implementar envio de texto, histórico persistido no banco, atualização em tempo real, indicador de mensagens não lidas e lista de conversas.
- Implementar bloqueio, denúncia, exclusão ou ocultação de conversas e controles de privacidade.
- Impedir acesso não autorizado às conversas.
- Free e Premium podem conversar gratuitamente, sem limite de quantidade de mensagens entre conexões aceitas, respeitando controles técnicos e de segurança.
- Não bloquear conversas existentes para forçar assinatura.

## 8. [Fase futura — em aberto] Vira Radar — descoberta regional

- Permitir selecionar cidade, estado e raio aproximado, filtrar interesses, encontrar pessoas com interesses semelhantes, encontrar grupos próximos e recomendar comunidades relevantes.
- Não exibir publicamente a localização exata dos usuários; priorizar informações aproximadas e controles de privacidade.

## 9. [Fase futura — em aberto] Vira Rolê — atividades e encontros

- Cobrir atividades sociais como cinema, futebol, academia, passeios, gastronomia, música, eventos, games e atividades culturais.
- Permitir criar rolês, escolher categoria, informar cidade e região aproximada, definir data e quantidade de participantes, solicitar participação, aprovar participantes, cancelar participação, compartilhar convite e denunciar eventos inadequados.
- Apresentar detalhes sensíveis de encontros privados somente a participantes autorizados.

## 10. [Fase futura — em aberto] Grupos e comunidades

- Criar comunidades por interesses, incluindo exemplos como futebol, games, música, filmes, relacionamentos, tecnologia, viagens, gastronomia, pets e atividades físicas.
- Permitir criar grupos, participar, solicitar entrada em grupos privados, moderar participantes, publicar conteúdos, gerenciar administradores, denunciar publicações e sair de grupos.
- Free: até três grupos criados pelo usuário. Premium: sem limite de grupos próprios para uso normal, sujeito a controles contra abuso.

## 11. [Fase futura — em aberto] Planos, permissões e Premium de teste

- Implementar estrutura para VIRA Free (R$ 0) e VIRA Premium (preço proposto de R$ 19,90 por mês).
- Free inclui: perfil; amizades; relacionamentos; um desafio criado por dia; participação em desafios públicos; 20 curtidas diárias; chat ilimitado com conexões aceitas; até três grupos próprios; filtros básicos; participação em rolês públicos.
- Premium inclui todas as funcionalidades Free; desafios ilimitados para uso normal; curtidas ilimitadas para uso normal; grupos próprios ilimitados para uso normal; filtros avançados; estatísticas de desafios; personalização exclusiva; recursos avançados de descoberta; experiência sem publicidade convencional; recursos futuros de inteligência artificial.
- A arquitetura deve permitir ativar cobranças reais futuramente. Durante validação, não realizar cobranças reais.
- Tipo de plano e permissões devem ser controlados de maneira segura no backend.
- Criar forma administrativa de conceder e remover acesso Premium de teste.

## 12. [Fase 1 — visual implementado; Preview verificado] Adaptação da referência visual fornecida

- Adaptar a direção visual da landing ao exemplo do usuário: fundo azul-marinho profundo; destaques em roxo, magenta e ciano; navegação superior; hero assimétrico com texto à esquerda e arte original com pessoas adultas à direita; elementos circulares luminosos e cartões de módulos ao redor; CTA de cadastro destacado.
- A tipografia e paleta devem permanecer legíveis e coerentes com o logo oficial do VIRA; manter responsividade e estados de claro/escuro onde aplicável.
- A faixa inferior pode usar quadros ilustrativos da marca, mas deve corresponder apenas às jornadas implementadas; não apresentar controles sociais futuros como telas operacionais.
- Os CTAs “Criar conta grátis”, “Entrar” e “Como funciona” devem conduzir a fluxos reais ou âncoras funcionais.
- Em celular, reorganizar hero, menu e faixa para leitura vertical sem distorcer ou recortar o logo.

## 13. [Extensão solicitada — código pronto; configuração de provedores pendente] Login social Google e Facebook

- Oferecer botões de login/cadastro social Google e Facebook nas telas de autenticação existentes, usando `supabase.auth.signInWithOAuth` e a sessão Supabase real.
- O fluxo deve retornar ao VIRA em `/auth/callback`, continuar para onboarding quando não houver perfil completo ou autodeclaração registrada e para a área autenticada quando o perfil estiver pronto; tratar carregamento, cancelamento e erro sem simular autenticação.
- Como os provedores sociais podem não enviar a data de nascimento, solicitar esse dado em privado no onboarding, exigir checkbox explícito de autodeclaração de 18 anos e bloquear a conclusão do perfil/uso da área autenticada sem isso.
- Para Google, configurar escopos de identidade, e-mail e perfil (`openid`, `userinfo.email`, `userinfo.profile`). Para Facebook, habilitar as permissões `public_profile` e `email`.
- Configurar os Redirect URLs da aplicação: `https://vira-cr5vxix7.manus.space/auth/callback`, `https://8328-imfejuxl072isgpvi2r95-708c8afa.us5.manus.computer/auth/callback`, `https://vira.onrender.com/auth/callback` e `http://localhost:3000/auth/callback`.
- Nos consoles Google e Facebook, cadastrar como callback do provedor o endereço Supabase `https://bcrjygubveuummfzpcfi.supabase.co/auth/v1/callback`; Google também deve permitir as origens JavaScript correspondentes.
- As credenciais Client ID/Secret e App ID/Secret devem permanecer em Supabase Auth e não podem ser incluídas no código, bundle, Render ou Git.

## 14. [Extensão solicitada — bucket/funções aplicados; aguarda primeiro teste real] Importação, armazenamento e troca de foto de perfil

- Criar e usar a coluna `profiles.avatar_path` e o bucket privado `vira-avatars`, com objetos separados por UUID do dono. Nesta fase, somente o usuário autenticado dono pode ler, enviar, substituir ou remover sua foto; permissões futuras de descoberta devem ser aprovadas junto ao módulo social.
- Antes de concluir o onboarding, informar que a foto disponível no Google/Facebook será importada automaticamente depois desta etapa e que a pessoa poderá trocá-la em Editar perfil. Após login social e conclusão do onboarding com data informada, maioridade declarada e autodeclaração registrada, importar automaticamente a foto disponibilizada pelo provedor, somente se a pessoa ainda não tiver escolhido uma foto. Nunca interpretar `user_metadata` como autorização, declaração etária ou prova de idade.
- A importação social deve usar a Edge Function `import-provider-avatar`, validar o JWT Supabase do usuário, aceitar apenas URLs HTTPS de hosts confiáveis Google/Facebook e bloquear redirects para hosts não autorizados, SSRF, tipos inválidos e arquivos maiores que 5 MiB.
- Disponibilizar na tela de perfil/edição um seletor local acessível, prévia, carregamento, erros e opção de trocar a foto. Aceitar somente JPEG, PNG ou WebP até 5 MiB e validar também a assinatura binária do conteúdo no servidor.
- O upload manual deve passar pela Edge Function autenticada `upload-profile-avatar`; limitar o corpo multipart a 5 MiB mais no máximo 256 KiB de overhead e validar sessão, onboarding e autodeclaração no servidor.
- A troca manual deve gravar um objeto em caminho único, atualizar `avatar_path` somente se o caminho anterior não mudou durante o upload e apagar a foto anterior apenas depois da atualização bem-sucedida. Em caso de conflito/falha, remover somente o arquivo recém-criado e manter a foto antiga.
- Exibir a foto privada por URL assinada de 10 minutos e renová-la em até 8 minutos durante a sessão e quando o app voltar ao foco.
- As duas Edge Functions devem exigir JWT, usar cliente Supabase com escopo RLS do usuário e ter allowlist CORS limitada a origens exatas; nunca expor `service_role`.

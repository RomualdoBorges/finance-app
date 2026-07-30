# Autenticação por e-mail e senha

Esta etapa implementa cadastro, login, logout, solicitação de recuperação de senha, verificação de e-mail, atualização de senha, exclusão da conta e observação da sessão com Firebase Authentication. O login com Google foi removido do escopo do projeto.

## Arquitetura

A camada visual usa hooks e não importa o Firebase. `FirebaseAuthRepository` é a única implementação da feature que chama o SDK modular (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `sendPasswordResetEmail`, `sendEmailVerification`, `reload`, `EmailAuthProvider.credential`, `reauthenticateWithCredential`, `updatePassword`, `deleteUser`, `signOut` e `onAuthStateChanged`). `AuthService` mantém o contrato disponível para a aplicação.

O Firebase `User` é convertido para o modelo interno `AuthenticatedUser`, que contém somente `uid`, `email`, `displayName`, `photoURL` e `emailVerified`. Credenciais completas, tokens e senha não são expostos.

O `AuthProvider` assina a sessão uma vez, começa em `loading`, publica `authenticated` ou `unauthenticated` e remove a assinatura ao desmontar. Ele também substitui o modelo interno pelo resultado de uma atualização manual via `reload`. É a única fonte da sessão; TanStack Query é usado apenas para as mutations de cadastro, login, logout, recuperação e verificação.

## Fluxos

O cadastro valida e-mail, senha mínima de 6 caracteres e confirmação, cria e autentica o usuário, mas não envia a verificação. O login valida e-mail e senha obrigatórios. Em ambos os casos, os componentes não navegam: os guards reagem à alteração observada da sessão. Depois que o Auth identifica a sessão, o provider de perfil garante idempotentemente `users/{uid}` no Firestore. Quando o perfil fica pronto, o provider de grupo garante `groups/{uid}` e o vínculo `OWNER` em `groupMembers/{uid}`.

O envio ocorre somente quando o usuário autenticado clica em “Enviar e-mail de verificação” na etapa `/verificar-email`. Não há chamada automática no cadastro, service, hook ou effect de autenticação.

`ProtectedRouteGuard` trata somente a presença da sessão: durante `loading`, exibe o fallback acessível compartilhado; sem usuário autenticado, redireciona para `/entrar` e preserva `pathname`, query e hash em `location.state`. Dentro dele, `VerifiedEmailGuard` redireciona usuários com `emailVerified: false` das rotas autenticadas normais para `/verificar-email`, mantendo esse destino. `EmailVerificationRouteGuard` permite que esses usuários permaneçam nessa etapa, envia visitantes a `/entrar` e, após a confirmação real no Auth, restaura o destino ou usa `/`. Essa composição evita redirecionamentos prematuros e loops.

`PublicOnlyGuard` protege `/entrar`, `/cadastro` e `/recuperar-senha`. Visitantes podem renderizá-las; usuários autenticados não verificados seguem para `/verificar-email`; usuários verificados seguem ao destino interno preservado ou à home autenticada `/`. Os paths ficam centralizados em `src/routes/paths.ts`, e helpers puros validam defensivamente o estado. URLs absolutas, protocol-relative, protocolos arbitrários e estados malformados são rejeitados, impedindo open redirect.

| Estado da sessão               | Rotas públicas de autenticação | `/verificar-email` | Rotas autenticadas verificadas |
| ------------------------------ | ------------------------------ | ------------------ | ------------------------------ |
| Carregando                     | Loading compartilhado          | Loading            | Loading                        |
| Não autenticado                | Permitidas                     | `/entrar`          | `/entrar`                      |
| Autenticado, não verificado    | `/verificar-email`             | Permitida          | `/verificar-email`             |
| Autenticado, e-mail verificado | Home ou destino preservado     | Home ou destino    | Permitidas                     |

Os guards dependem exclusivamente do estado publicado pelo `AuthProvider`; não importam Firebase, consultam Firestore nem aguardam o `UserProfileProvider`. As rotas verificadas atuais são `/`, `/conta/alterar-senha`, `/conta/excluir` e a página 404 autenticada. A cobertura combina testes puros do estado de redirect, testes de composição dos guards, fluxos de páginas e Playwright com repository E2E determinístico. Grupos, papéis, claims e autorização de domínio continuam fora desta etapa.

Na etapa de verificação, após um envio bem-sucedido, o controle fica indisponível por 60 segundos para reduzir reenvios acidentais. A ação “Já verifiquei meu e-mail” chama `reload` no usuário atual e publica o novo `AuthenticatedUser`. Se o Firebase ainda informar `emailVerified: false`, a página orienta a concluir o link e tentar novamente; quando o valor passa a `true`, o guard libera a home.

A rota `/conta/alterar-senha` fica dentro de `ProtectedRouteGuard` e `VerifiedEmailGuard` e só oferece o formulário quando o usuário autenticado também possui e-mail. O formulário exige senha atual, nova senha e confirmação. O fluxo segue repository → service → hook: o repository cria a credencial de e-mail e senha atual, executa `reauthenticateWithCredential` e somente após sucesso chama `updatePassword`.

Senha atual incorreta, credencial inválida, sessão recente exigida, senha fraca, excesso de tentativas, rede e falhas desconhecidas são convertidas em mensagens de domínio. Se a reautenticação falhar, a atualização não é chamada. Após sucesso, os três campos são limpos, a confirmação permanece na mesma página e a sessão autenticada é preservada, sem refresh, logout ou navegação automática. As senhas existem somente no estado local do React Hook Form enquanto a página está montada; não são persistidas nem registradas.

A rota `/conta/excluir` exige sessão autenticada, e-mail disponível e verificado. O usuário informa a senha atual e confirma explicitamente a permanência da ação. O repository reautentica e somente depois chama `deleteUser`. Após o sucesso, a mutation executa o logout existente; `onAuthStateChanged` publica a ausência de usuário e os guards redirecionam para `/entrar`. Em falha, os campos permanecem apenas no formulário para nova tentativa, sem navegação.

`SensitiveAction`, `SensitiveOperation` e `ReauthenticationRequirement` centralizam o contrato das operações sensíveis de alteração de senha e exclusão. A implementação atual exige apenas reautenticação por senha. Os contratos permitem acrescentar uma segunda etapa futuramente, mas MFA, TOTP, SMS e APIs multifator não estão implementados.

Erros técnicos são convertidos em códigos de domínio e mensagens sanitizadas em português. O login usa mensagem genérica para credenciais inválidas e a interface não mostra códigos, stacks ou detalhes internos.

O logout percorre repository → service → hook de mutation. Em caso de sucesso, `onAuthStateChanged` publica a sessão sem usuário e o `ProtectedRouteGuard` redireciona para `/entrar`; o botão não navega manualmente. Em caso de falha, a sessão e a rota protegida são preservadas, o botão é reabilitado e uma mensagem sanitizada é anunciada.

A rota pública `/recuperar-senha`, protegida por `PublicOnlyGuard`, recebe somente um e-mail normalizado e chama `sendPasswordResetEmail(auth, email)` sem `ActionCodeSettings`. O sucesso substitui o formulário por uma confirmação neutra, sem mostrar o e-mail e sem redirecionamento. Respostas de usuário inexistente também são tratadas como sucesso neutro para impedir enumeração de contas. Falhas de formato, limite de tentativas, rede e erros desconhecidos usam mensagens sanitizadas.

## Auth Emulator

A inicialização existente respeita `VITE_FIREBASE_USE_EMULATORS`. Quando a flag está ativa, o cliente Auth já inicializado é conectado ao host e à porta validados no ambiente. Não há segunda inicialização.

Testes unitários e de integração usam mocks do repository e não acessam rede nem Firebase real. No build E2E, o repository isolado pode iniciar uma sessão fictícia pelo marcador `e2e-authenticated` na URL, simular a atualização da verificação, aceitar uma senha atual fictícia controlada para a troca de senha e emitir a sessão nula ao sair, sem credenciais ou rede. A configuração existente continua direcionando o SDK real ao Auth Emulator quando habilitada; nenhuma segunda conexão é criada.

## Segurança e limitações

Senhas permanecem somente no estado do React Hook Form e não são persistidas em URL, storage, Zustand ou logs. Nenhum token é exposto e nenhum acesso ao Firestore foi adicionado.

Continuam pendentes: confirmação de redefinição por código, MFA, grupos compartilhados e troca de grupo. O documento básico está descrito em `docs/user-profile.md` e o grupo individual ativo em `docs/personal-group.md`. A exclusão remove somente a identidade do Firebase Authentication e, temporariamente, não remove os documentos do Firestore. Nenhuma regra de negócio financeira ou autorização por papéis adicionais foi adicionada nesta etapa.

# Autenticação por e-mail e senha

Esta etapa implementa cadastro, login, logout, solicitação de recuperação de senha, verificação de e-mail e observação da sessão com Firebase Authentication. O login com Google foi removido do escopo do projeto.

## Arquitetura

A camada visual usa hooks e não importa o Firebase. `FirebaseAuthRepository` é a única implementação da feature que chama o SDK modular (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `sendPasswordResetEmail`, `sendEmailVerification`, `reload`, `signOut` e `onAuthStateChanged`). `AuthService` mantém o contrato disponível para a aplicação.

O Firebase `User` é convertido para o modelo interno `AuthenticatedUser`, que contém somente `uid`, `email`, `displayName`, `photoURL` e `emailVerified`. Credenciais completas, tokens e senha não são expostos.

O `AuthProvider` assina a sessão uma vez, começa em `loading`, publica `authenticated` ou `unauthenticated` e remove a assinatura ao desmontar. Ele também substitui o modelo interno pelo resultado de uma atualização manual via `reload`. É a única fonte da sessão; TanStack Query é usado apenas para as mutations de cadastro, login, logout, recuperação e verificação.

## Fluxos

O cadastro valida e-mail, senha mínima de 6 caracteres e confirmação, cria e autentica o usuário, mas não envia a verificação. O login valida e-mail e senha obrigatórios. Em ambos os casos, os componentes não navegam: os guards reagem à alteração observada da sessão. Não há criação de documento no Firestore ou grupo.

O envio ocorre somente quando o usuário autenticado clica em “Enviar e-mail de verificação” na etapa `/verificar-email`. Não há chamada automática no cadastro, service, hook ou effect de autenticação.

`ProtectedRouteGuard` trata somente a presença da sessão: durante `loading`, aguarda; sem usuário autenticado, redireciona para `/login`. Dentro dele, `VerifiedEmailGuard` redireciona usuários com `emailVerified: false` das rotas autenticadas normais para `/verificar-email`. `EmailVerificationRouteGuard` permite que esses usuários permaneçam nessa etapa e redireciona usuários já verificados para a home. Essa composição evita redirecionamentos prematuros e loops.

Na etapa de verificação, após um envio bem-sucedido, o controle fica indisponível por 60 segundos para reduzir reenvios acidentais. A ação “Já verifiquei meu e-mail” chama `reload` no usuário atual e publica o novo `AuthenticatedUser`. Se o Firebase ainda informar `emailVerified: false`, a página orienta a concluir o link e tentar novamente; quando o valor passa a `true`, o guard libera a home.

Erros técnicos são convertidos em códigos de domínio e mensagens sanitizadas em português. O login usa mensagem genérica para credenciais inválidas e a interface não mostra códigos, stacks ou detalhes internos.

O logout percorre repository → service → hook de mutation. Em caso de sucesso, `onAuthStateChanged` publica a sessão sem usuário e o `ProtectedRouteGuard` redireciona para `/login`; o botão não navega manualmente. Em caso de falha, a sessão e a rota protegida são preservadas, o botão é reabilitado e uma mensagem sanitizada é anunciada.

A rota pública `/recuperar-senha`, protegida por `PublicOnlyGuard`, recebe somente um e-mail normalizado e chama `sendPasswordResetEmail(auth, email)` sem `ActionCodeSettings`. O sucesso substitui o formulário por uma confirmação neutra, sem mostrar o e-mail e sem redirecionamento. Respostas de usuário inexistente também são tratadas como sucesso neutro para impedir enumeração de contas. Falhas de formato, limite de tentativas, rede e erros desconhecidos usam mensagens sanitizadas.

## Auth Emulator

A inicialização existente respeita `VITE_FIREBASE_USE_EMULATORS`. Quando a flag está ativa, o cliente Auth já inicializado é conectado ao host e à porta validados no ambiente. Não há segunda inicialização.

Testes unitários e de integração usam mocks do repository e não acessam rede nem Firebase real. No build E2E, o repository isolado pode iniciar uma sessão fictícia pelo marcador `e2e-authenticated` na URL, simular a atualização da verificação e emitir a sessão nula ao sair, sem credenciais ou rede.

## Segurança e limitações

Senhas permanecem somente no estado do React Hook Form e não são persistidas em URL, storage, Zustand ou logs. Nenhum token é exposto e nenhum acesso ao Firestore foi adicionado.

Continuam pendentes: atualização de senha, confirmação de redefinição por código, exclusão de usuário, MFA, documento do usuário, grupos e grupo ativo/padrão. Nenhuma regra de negócio financeira, Firestore Rule ou autorização por papel foi adicionada nesta etapa.

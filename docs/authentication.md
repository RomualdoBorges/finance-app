# Autenticação por e-mail e senha

Esta etapa implementa cadastro, login, logout e observação da sessão com Firebase Authentication. O login com Google foi removido do escopo do projeto.

## Arquitetura

A camada visual usa hooks e não importa o Firebase. `FirebaseAuthRepository` é a única implementação da feature que chama o SDK modular (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signOut` e `onAuthStateChanged`). `AuthService` mantém o contrato disponível para a aplicação.

O Firebase `User` é convertido para o modelo interno `AuthenticatedUser`, que contém somente `uid`, `email`, `displayName`, `photoURL` e `emailVerified`. Credenciais completas, tokens e senha não são expostos.

O `AuthProvider` assina a sessão uma vez, começa em `loading`, publica `authenticated` ou `unauthenticated` e remove a assinatura ao desmontar. Ele é a única fonte da sessão; TanStack Query é usado apenas para as mutations de cadastro, login e logout.

## Fluxos

O cadastro valida e-mail, senha mínima de 6 caracteres e confirmação. O login valida e-mail e senha obrigatórios. Em ambos os casos, a alteração observada da sessão faz o `PublicOnlyGuard` navegar para a rota inicial protegida. Não há criação de documento no Firestore ou grupo.

Erros técnicos são convertidos em códigos de domínio e mensagens sanitizadas em português. O login usa mensagem genérica para credenciais inválidas e a interface não mostra códigos, stacks ou detalhes internos.

O logout percorre repository → service → hook de mutation. Em caso de sucesso, `onAuthStateChanged` publica a sessão sem usuário e o `ProtectedRouteGuard` redireciona para `/login`; o botão não navega manualmente. Em caso de falha, a sessão e a rota protegida são preservadas, o botão é reabilitado e uma mensagem sanitizada é anunciada.

## Auth Emulator

A inicialização existente respeita `VITE_FIREBASE_USE_EMULATORS`. Quando a flag está ativa, o cliente Auth já inicializado é conectado ao host e à porta validados no ambiente. Não há segunda inicialização.

Testes unitários e de integração usam mocks do repository e não acessam rede nem Firebase real. No build E2E, o repository isolado pode iniciar uma sessão fictícia pelo marcador `e2e-authenticated` na URL e emite a sessão nula ao sair, sem credenciais ou rede.

## Segurança e limitações

Senhas permanecem somente no estado do React Hook Form e não são persistidas em URL, storage, Zustand ou logs. Nenhum token é exposto e nenhum acesso ao Firestore foi adicionado.

Continuam pendentes: recuperação e atualização de senha, verificação de e-mail, exclusão de usuário, MFA, documento do usuário, grupos e grupo ativo/padrão.

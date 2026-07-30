# Documento do usuário

O perfil básico do usuário autenticado é persistido em `users/{uid}`. O ID do documento é a fonte de verdade e não é duplicado nos campos.

```text
users/{uid}
  email: string | null
  displayName: string | null
  photoURL: string | null
  activeGroupId?: string
  createdAt: Timestamp
  updatedAt: Timestamp
```

No domínio, `UserProfile` expõe `id`, os três campos básicos, `activeGroupId` como string ou `null` durante o bootstrap e datas JavaScript (`Date`). `Timestamp`, snapshots e referências do Firestore ficam restritos aos repositories.

Depois que o listener existente do Firebase Auth identifica um usuário, `UserProfileProvider` executa `UserService.ensureUserProfile`. Se o documento não existe, o repository grava dados básicos com `serverTimestamp()` e relê para materializar as datas. Se existe, compara os três dados básicos: sem mudança não escreve; com mudança grava somente os campos alterados e `updatedAt`, preservando `createdAt` e campos futuros.

O provider usa uma query por `['user-profile', uid]`, sem polling, retry automático ou refetch agressivo. Expõe `idle`, `loading`, `ready`, `error` e `refreshProfile`. Falhas geram aviso não bloqueante; autenticação e rotas permanecem disponíveis.

As Rules permitem leitura, criação e atualização somente em `users/{request.auth.uid}`, validam campos, tipos nullable, timestamps do servidor e imutabilidade de `createdAt`; exclusão é negada. `activeGroupId` só pode apontar para um grupo existente cujo vínculo `financialGroups/{groupId}/members/{uid}` seja `owner` ativo. O `FirestoreUserRepository` é a única fronteira que lê ou escreve esse campo. O cliente e a conexão ao Emulator são reutilizados. No E2E de interface, repositories determinísticos funcionam sem rede; um teste de integração separado exercita Auth e Firestore Emulators reais.

O documento não contém senha, tokens, claims, papéis, permissões ou dados financeiros. Não há edição manual de perfil, avatar, grupos, listeners ou polling. Temporariamente, excluir a identidade do Firebase Authentication não remove `users/{uid}` nem os documentos do grupo; a estratégia de limpeza ou anonimização permanece obrigatoriamente pendente antes da primeira release com dados financeiros.

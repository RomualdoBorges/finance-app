# Documento do usuário

O perfil básico do usuário autenticado é persistido em `users/{uid}`. O ID do documento é a fonte de verdade e não é duplicado nos campos.

```text
users/{uid}
  email: string | null
  displayName: string | null
  photoURL: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
```

No domínio, `UserProfile` expõe `id`, os três campos básicos e datas JavaScript (`Date`). `Timestamp`, snapshots e referências do Firestore ficam restritos ao `FirestoreUserRepository`.

Depois que o listener existente do Firebase Auth identifica um usuário, `UserProfileProvider` executa `UserService.ensureUserProfile`. Se o documento não existe, o repository grava dados básicos com `serverTimestamp()` e relê para materializar as datas. Se existe, compara os três dados básicos: sem mudança não escreve; com mudança grava somente os campos alterados e `updatedAt`, preservando `createdAt` e campos futuros.

O provider usa uma query por `['user-profile', uid]`, sem polling, retry automático ou refetch agressivo. Expõe `idle`, `loading`, `ready`, `error` e `refreshProfile`. Falhas geram aviso não bloqueante; autenticação e rotas permanecem disponíveis.

As Rules permitem leitura, criação e atualização somente em `users/{request.auth.uid}`, validam campos, tipos nullable, timestamps do servidor e imutabilidade de `createdAt`; exclusão é negada. O cliente e a conexão ao Emulator são reutilizados. No E2E, um repository determinístico funciona sem rede.

O documento não contém senha, tokens, claims, papéis, permissões, grupo ativo ou dados financeiros. Não há edição manual de perfil, avatar, grupos, listeners ou polling. Temporariamente, excluir a identidade do Firebase Authentication não remove `users/{uid}`; nenhuma exclusão em cascata ou Cloud Function foi adicionada.

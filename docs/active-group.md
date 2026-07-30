# Grupo ativo

O identificador do grupo ativo permanece em `users/{uid}.activeGroupId`. Ele é
uma referência explícita para `financialGroups/{groupId}` e nunca é inferido do
UID fora da criação inicial do grupo pessoal.

`FirestoreUserRepository.ensureActiveGroupId`:

1. lê o perfil;
2. retorna sem escrita quando o valor já é o esperado;
3. grava `activeGroupId` e `updatedAt` do servidor somente quando o campo está
   ausente;
4. relê e retorna o perfil materializado.

As Rules aceitam o valor somente quando o grupo existe e
`financialGroups/{groupId}/members/{uid}` é um membership `owner` ativo.

`GroupService.bootstrapPersonalGroup` usa o ID retornado pelo perfil para
carregar o grupo ativo. `GroupProvider` publica o resultado e atualiza o cache
de `['user-profile', uid]` com o mesmo perfil, garantindo consistência entre
`useUserProfile().profile.activeGroupId` e `useGroup().activeGroup.id`.

Seleção e troca de grupos pela interface permanecem fora do escopo.

# Grupo pessoal

Após `UserProfileProvider` materializar `users/{uid}`, `GroupProvider` chama o
caso de uso `GroupService.bootstrapPersonalGroup`. O modelo definitivo é:

```text
financialGroups/{groupId}
  name: "Meu Financeiro"
  type: "personal"
  currency: "BRL"
  ownerId: uid
  status: "active"
  createdAt: Timestamp
  updatedAt: Timestamp

financialGroups/{groupId}/members/{uid}
  groupId: groupId
  userId: uid
  role: "owner"
  status: "active"
  createdAt: Timestamp
  updatedAt: Timestamp

users/{uid}
  activeGroupId: groupId
```

O grupo pessoal inicial usa `groupId = uid` como estratégia determinística
somente no início do bootstrap. Repositories, Rules de participação e leituras
posteriores recebem `groupId` e `userId` explicitamente; a arquitetura não trata
a igualdade entre eles como regra geral.

`FirestorePersonalGroupProvisioningRepository` cria grupo e membership juntos
em uma transação. Ele existe apenas para preservar a atomicidade desse par.
`FirestoreGroupRepository` lê grupos, `FirestoreMembershipRepository` lê
participações, e `FirestoreUserRepository` mantém `activeGroupId`.
`GroupService` coordena essas fronteiras e retorna grupo, grupo ativo,
membership e perfil consolidados.

Chamadas repetidas não recriam documentos nem alteram timestamps. Depois de
persistir o grupo ativo, `GroupProvider` atualiza diretamente a query
`['user-profile', uid]` com o perfil retornado, sem leitura adicional e sem
fontes divergentes.

O bootstrap continua no cliente nesta etapa, protegido pelas Firestore Rules.
Múltiplos grupos, troca pela interface, convites e outros papéis não estão
implementados.

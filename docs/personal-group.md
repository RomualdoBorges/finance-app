# Grupo individual

Após `UserProfileProvider` materializar `users/{uid}`, `GroupProvider` garante o
grupo individual. Nesta etapa existem somente:

```text
groups/{uid}
  name: "Meu Financeiro"
  createdAt: Timestamp
  updatedAt: Timestamp

groupMembers/{uid}
  groupId: uid
  userId: uid
  role: "OWNER"
  createdAt: Timestamp

users/{uid}
  activeGroupId: uid
```

`FirestoreGroupRepository.ensurePersonalGroup` lê os dois documentos em uma
transação e cria apenas os que estiverem ausentes. Os IDs são determinísticos,
os timestamps são do servidor e chamadas repetidas não escrevem nem atualizam
`updatedAt`. A releitura posterior materializa os timestamps no domínio.

As Rules permitem o bootstrap conjunto apenas ao usuário autenticado cujo UID é
o ID do grupo e do vínculo. Grupo e membership não podem ser atualizados ou
excluídos pelo cliente nesta etapa. A leitura de outro usuário é bloqueada.

Depois de garantir grupo e membership, o mesmo repository preenche
`activeGroupId` somente se estiver ausente e carrega esse grupo. Se o campo já
for igual ao UID, não há escrita nem alteração de `updatedAt`.

`GroupProvider` é a fonte única do grupo corrente e expõe `group`,
`activeGroup`, `membership`, `status` e `refresh()`. `useActiveGroup()` oferece
`activeGroup`, `loading`, `error` e `refresh` sem acessar Firestore. Falhas são
não bloqueantes. Troca de grupo, convites, compartilhamento, outros papéis e
recursos financeiros continuam fora do escopo.

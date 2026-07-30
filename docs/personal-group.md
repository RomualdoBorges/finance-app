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
```

`FirestoreGroupRepository.ensurePersonalGroup` lê os dois documentos em uma
transação e cria apenas os que estiverem ausentes. Os IDs são determinísticos,
os timestamps são do servidor e chamadas repetidas não escrevem nem atualizam
`updatedAt`. A releitura posterior materializa os timestamps no domínio.

As Rules permitem o bootstrap conjunto apenas ao usuário autenticado cujo UID é
o ID do grupo e do vínculo. Grupo e membership não podem ser atualizados ou
excluídos pelo cliente nesta etapa. A leitura de outro usuário é bloqueada.

`GroupProvider` expõe `group`, `membership`, `status` e `refresh()`. Falhas são
não bloqueantes. Troca de grupo, grupo ativo/padrão, convites, compartilhamento,
outros papéis e recursos financeiros continuam fora do escopo.

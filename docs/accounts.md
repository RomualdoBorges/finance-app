# Contas — Milestone 2

Neste item, contas são documentos em
`financialGroups/{groupId}/accounts/{accountId}` destinados somente ao cadastro,
edição, arquivamento e restauração.

O contrato contém `groupId`, `name`, `normalizedName`, `description`,
`institutionName`, `icon`, `color`, `status`, `isArchived`, `createdBy`,
`createdAt` e `updatedAt`. Não há campo provisório de tipo: tipos e opções de
inclusão em saldo/patrimônio pertencem ao próximo item do roadmap.

`groupId` e `createdBy` são derivados do contexto autenticado. Datas usam tempo
do servidor. A conta nasce com `status: active` e `isArchived: false`. Somente
nome, descrição, instituição, ícone e cor são editáveis; a edição preserva o
arquivamento.

Duas contas ativas do mesmo grupo não podem ter o mesmo `normalizedName`.
Contas arquivadas não bloqueiam uma nova criação, mas a restauração revalida a
unicidade. Essa garantia está no service e pode sofrer corrida em criações
concorrentes; as Security Rules não conseguem consultar o conjunto reverso para
garanti-la atomicamente.

Arquivar e restaurar são operações idempotentes. Não existe exclusão física:
contas são preservadas para a integridade histórica de futuros lançamentos,
transferências, faturas e saldos.

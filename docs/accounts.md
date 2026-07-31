# Contas — Milestone 2

Contas são documentos em `financialGroups/{groupId}/accounts/{accountId}` com
cadastro, edição, arquivamento, restauração, tipo e opções que serão consumidas
por consolidações futuras.

O contrato contém `groupId`, `name`, `normalizedName`, `description`,
`institutionName`, `icon`, `color`, `accountType`, `includeInBalance`,
`includeInNetWorth`, `status`, `isArchived`, `createdBy`, `createdAt` e
`updatedAt`.

`accountType` usa o enum fechado: `checking` (Conta corrente), `savings`
(Poupança), `cash` (Dinheiro), `credit_card` (Cartão de crédito), `investment`
(Investimento), `digital_wallet` (Carteira digital) e `other` (Outra). Não há
campos específicos por tipo nesta etapa.

| Tipo | `includeInBalance` | `includeInNetWorth` |
| --- | --- | --- |
| `checking` | `true` | `true` |
| `savings` | `true` | `true` |
| `cash` | `true` | `true` |
| `credit_card` | `false` | `true` |
| `investment` | `false` | `true` |
| `digital_wallet` | `true` | `true` |
| `other` | `true` | `true` |

`includeInBalance` apenas registra se a conta participará do futuro saldo
financeiro consolidado. `includeInNetWorth` apenas registra se participará do
futuro patrimônio líquido. Uma conta `credit_card` incluída no patrimônio será
tratada futuramente como passivo, nunca como ativo. Nenhum saldo ou patrimônio
é calculado neste item.

Ao trocar o tipo no formulário, cada opção recebe o default novo somente quando
ainda é igual ao default do tipo anterior. Uma escolha manual divergente é
preservada individualmente. O ícone continua livre e opcional.

Documentos legados sem os três campos continuam legíveis: o mapper usa
`accountType: other`, `includeInBalance: true` e `includeInNetWorth: true`. Não
há migração em massa. A próxima edição completa persiste os três campos e passa
a cumprir o contrato novo.

`groupId` e `createdBy` são derivados do contexto autenticado. Datas usam tempo
do servidor. A conta nasce ativa e não arquivada. Nome, descrição, instituição,
ícone, cor, tipo e as duas opções são editáveis; a edição preserva o estado de
arquivamento.

Duas contas ativas do mesmo grupo não podem ter o mesmo `normalizedName`.
Contas arquivadas não bloqueiam uma nova criação, mas a restauração revalida a
unicidade. Essa garantia está no service e pode sofrer corrida em criações
concorrentes; as Security Rules não conseguem consultar o conjunto reverso para
garanti-la atomicamente.

Arquivar e restaurar são operações idempotentes. Não existe exclusão física:
contas são preservadas para a integridade histórica de futuros lançamentos,
transferências, faturas e saldos.

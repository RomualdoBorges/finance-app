# Contas — Milestone 2

Contas são documentos em `financialGroups/{groupId}/accounts/{accountId}` com
cadastro, edição, arquivamento, restauração, tipo e opções que serão consumidas
por consolidações futuras.

O contrato contém `groupId`, `name`, `normalizedName`, `description`,
`institutionName`, `icon`, `color`, `accountType`, `includeInBalance`,
`includeInNetWorth`, `status`, `isArchived`, `createdBy`, `createdAt` e
`updatedAt`, além de `initialBalanceMinor` e `initialBalanceDate`.

## Saldo inicial

O saldo inicial representa quanto já existia na conta em uma data de
referência; ele não é saldo atual nem projetado e não dispara qualquer cálculo.
A moeda desta etapa é fixa em BRL. `initialBalanceMinor` é um inteiro em centavos
entre `-9.000.000.000.000` e `9.000.000.000.000`; por exemplo, R$ 1.234,56 é
persistido como `123456`. `initialBalanceDate` é uma data civil persistida como
string `YYYY-MM-DD`, sem conversão de timezone.

Semântica por tipo: `checking`, `cash` e `digital_wallet` representam o saldo
disponível na data; `savings`, o saldo existente; `investment`, o valor existente;
`credit_card`, o valor devido; e `other`, saldo ou obrigação existente. Dívidas
de cartão são informadas como valores negativos e zero significa ausência de
dívida. Valores positivos em cartão não são bloqueados tecnicamente.

Enquanto não existem lançamentos, valor e data podem ser editados normalmente.
Essa regra deverá ser revista quando lançamentos forem implementados. Arquivar e
restaurar preservam os dois campos.

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

Documentos legados sem os campos anteriores continuam legíveis: o mapper usa
`accountType: other`, `includeInBalance: true` e `includeInNetWorth: true`. Não
há migração em massa. A próxima edição completa persiste os três campos e passa
a cumprir o contrato novo.

Para os campos financeiros ausentes, o mapper usa `initialBalanceMinor: 0` e
`initialBalanceDate: null`. O `null` existe apenas no domínio de leitura legado
para não inventar uma data financeira; a próxima edição exige uma data e
persiste o contrato completo. Não há migração em massa.

`groupId` e `createdBy` são derivados do contexto autenticado. `createdAt` e
`updatedAt` usam tempo do servidor; a data civil do saldo inicial segue a regra
acima. A conta nasce ativa e não arquivada. Nome, descrição, instituição, ícone,
cor, tipo, saldo inicial/data e as duas opções são editáveis; a edição preserva
o estado de arquivamento.

Duas contas ativas do mesmo grupo não podem ter o mesmo `normalizedName`.
Contas arquivadas não bloqueiam uma nova criação, mas a restauração revalida a
unicidade. Essa garantia está no service e pode sofrer corrida em criações
concorrentes; as Security Rules não conseguem consultar o conjunto reverso para
garanti-la atomicamente.

Arquivar e restaurar são operações idempotentes. Não existe exclusão física:
contas são preservadas para a integridade histórica de futuros lançamentos,
transferências, faturas e saldos.

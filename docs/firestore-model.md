# Modelo do Cloud Firestore

Modelo definido pela especificação oficial. Todos os dados financeiros pertencem a `/financialGroups/{groupId}`; até o usuário individual possui seu próprio grupo.

## Usuário — Milestone 1

O documento básico fica em `/users/{uid}`. O ID corresponde ao UID e não é persistido como campo. Contém apenas `email`, `displayName` e `photoURL` como string ou null, além de `createdAt` imutável e `updatedAt` condicional como timestamps do servidor. Não contém senha, tokens, claims, papéis, permissões, grupos ou dados financeiros. Detalhes estão em `docs/user-profile.md`.

## Convenções

- dinheiro: número inteiro em centavos;
- datas e instantes: `Firestore Timestamp`;
- mês de referência: string `YYYY-MM` quando identifica um documento/período;
- referências entre documentos: IDs explícitos;
- saldos e agregados consolidados são protegidos contra escrita do cliente e mantidos por Functions;
- exclusão lógica por `status` preserva histórico;
- exemplos omitem campos secundários, mas não reduzem os requisitos do domínio.

## Estrutura

```text
/users/{userId}
/financialGroups/{groupId}
  /members/{userId}
  /accounts/{accountId}
  /cards/{cardId}
  /invoices/{invoiceId}
  /installmentPlans/{installmentPlanId}
  /transactions/{transactionId}
  /categories/{categoryId}
  /budgets/{budgetId}
  /recurrences/{recurrenceId}
  /goals/{goalId}
  /debts/{debtId}
  /investments/{investmentId}
  /assets/{assetId}
  /subscriptions/{subscriptionId}
  /imports/{importId}
  /rules/{ruleId}
  /notifications/{notificationId}
  /monthlySummaries/{referenceMonth}
  /netWorthHistory/{referenceMonth}
  /auditLogs/{auditLogId}
/invitations/{invitationId}
```

## Coleções raiz

### `users` — MVP

Documento identificado pelo UID: `displayName`, `email`, `photoURL`, `currency`, `locale`, `timezone`, `emailVerified`, `onboardingCompleted`, `createdAt`, `updatedAt` e referência do grupo padrão/ativo quando adotada. Não armazena senha, hash, token ou credencial bancária.

### `financialGroups` — grupo pessoal no Milestone 1

O contrato entregue aceita somente `name: "Meu Financeiro"`, `type: "personal"`,
`currency: "BRL"`, `ownerId`, `status: "active"`, `createdAt` e `updatedAt`.
O grupo inicial usa um ID determinístico igual ao UID somente durante sua
criação; todas as APIs posteriores recebem `groupId` explicitamente. Tipos
compartilhados, outras moedas e eventual desnormalização para consultas serão
contratados apenas nas fases correspondentes.

### `invitations` — Fase 4

Convite externo processado por Function. O PDF não define seu esquema; campos de destinatário, papel, status, expiração e auditoria ainda precisam de contrato antes da implementação.

## Subcoleções do grupo

### `members` — owner pessoal no Milestone 1

O documento fica em `financialGroups/{groupId}/members/{userId}` e contém
`userId`, `groupId`, `role: "owner"`, `status: "active"`, `createdAt` e
`updatedAt`. Outros papéis, permissões e dados desnormalizados de participante
permanecem fora do escopo até a fase de grupos compartilhados.

### `accounts` — Milestone 2 (cadastro e manutenção)

O documento fica em `financialGroups/{groupId}/accounts/{accountId}` e contém
`groupId`, `name`, `normalizedName`, `description`, `institutionName`, `icon`,
`color`, `status`, `isArchived`, `createdBy`, `createdAt` e `updatedAt`.
Campos opcionais são persistidos como `null`; datas usam `Firestore Timestamp`.
Tipos, opções de consolidação, saldo inicial e saldos atual/projetado permanecem
fora deste item. O contrato e as decisões estão em `docs/accounts.md`.

### `categories` — Milestone 2

O documento fica em
`financialGroups/{groupId}/categories/{categoryId}` e contém `groupId`, `name`,
`normalizedName`, `type` (`income` ou `expense`), `origin` (`default` ou
`custom`), `status: "active"`, `parentCategoryId`, `icon`, `createdBy`,
`createdAt` e `updatedAt`. `usageCount` é um inteiro protegido, iniciado em zero,
que representa vínculos históricos e sustenta a decisão entre exclusão e
arquivamento. Datas persistidas são `Firestore Timestamp`.

Categorias raiz usam `parentCategoryId: null`. Subcategorias apontam para uma
raiz do mesmo grupo e tipo; profundidade maior que um não é aceita. Categorias
padrão têm IDs determinísticos em inglês e são provisionadas de forma
idempotente, somente para documentos ausentes. Categorias podem estar `active`
ou `archived`; as arquivadas permanecem disponíveis para histórico. Detalhes de
domínio, segurança e limitação de unicidade estão em `docs/categories.md`.

### `transactions` — MVP; tipos adicionais nas fases seguintes

Campos: `type`, `description`, `amount`, `competenceDate`, `paymentDate`, `dueDate`, `status`, `accountId`, `cardId`, `invoiceId`, `categoryId`, `subcategoryId`, `ownerId`, `createdBy`, `visibility`, `paymentMethod`, `merchant`, `tags`, `notes`, `recurrenceId`, `installmentPlanId`, `installmentNumber`, `installmentTotal`, `transferId`, `attachmentIds`, `createdAt`, `updatedAt`.

Tipos: `income`, `expense`, `transfer_in`, `transfer_out`, `balance_adjustment`, `card_purchase`, `invoice_payment`, `refund`, `investment_contribution`, `investment_withdrawal`. Status: `planned`, `pending`, `confirmed`, `overdue`, `cancelled`, `refunded`, `partially_refunded`. Visibilidade: `private`, `shared`.

### `budgets` — MVP

Campos: `referenceMonth`, `categoryId`, `plannedAmount`, `spentAmount`, `pendingAmount`, `availableAmount`, `usagePercentage`, `status` (`healthy`, `warning`, `reached`, `exceeded`), `createdAt`, `updatedAt`. Todos os totais, exceto o planejado fornecido pelo usuário, são consolidados por Function.

### `recurrences` — MVP

Campos: `type`, `description`, `amount`, `frequency`, `interval`, `startDate`, `endDate`, `nextExecutionAt`, `accountId`, `categoryId`, `automaticConfirmation`, `generateDaysBefore`, `status`, `createdBy`, `createdAt`, `updatedAt`. Frequências: `daily`, `weekly`, `biweekly`, `monthly`, `bimonthly`, `quarterly`, `semiannual`, `yearly`, `custom`. Cada ocorrência usa a chave lógica `recurrenceId + referenceDate`.

### `monthlySummaries` — MVP

ID recomendado igual a `referenceMonth`. Campos: `referenceMonth`, `income`, `expenses`, `result`, `confirmedIncome`, `confirmedExpenses`, `pendingIncome`, `pendingExpenses`, `availableBalance`, `projectedBalance`, `savingsRate`, `categoryTotals`, `updatedAt`. É a fonte principal do dashboard e não pode ser escrita pelo cliente.

### `auditLogs` — MVP para operações críticas

Campos: `actorId`, `action`, `entityType`, `entityId`, `before`, `after`, `source`, `createdAt`. Functions criam os registros; frontend não edita nem apaga.

### `cards` — Fase 2

Campos: `name`, `institutionName`, `brand`, `lastFourDigits`, `ownerId`, `creditLimit`, `availableLimit`, `closingDay`, `dueDay`, `paymentAccountId`, `color`, `status`, `createdAt`, `updatedAt`. Não guarda número completo, CVV, senha ou validade completa sem necessidade real e tratamento específico.

### `invoices` — Fase 2

Campos: `cardId`, `referenceMonth`, `closingDate`, `dueDate`, `status`, `totalAmount`, `paidAmount`, `remainingAmount`, `purchaseCount`, `createdAt`, `updatedAt`. Status: `future`, `open`, `closed`, `partially_paid`, `paid`, `overdue`, `cancelled`.

### `installmentPlans` — Fase 2

Campos: `description`, `totalAmount`, `installmentCount`, `installmentAmount`, `cardId`, `categoryId`, `purchaseDate`, `status`, `createdBy`, `createdAt`. Relaciona-se às parcelas em `transactions` por `installmentPlanId`.

### `notifications` — Fase 2

Campos: `userId`, `type`, `title`, `message`, `entityType`, `entityId`, `read`, `createdAt`. Sustenta a central interna; entrega externa usa FCM ou e-mail.

### `imports` — Fase 3

Campos: `fileName`, `fileType`, `storagePath`, `accountId`, `status`, `totalRows`, `importedRows`, `ignoredRows`, `duplicatedRows`, `errorRows`, `createdBy`, `createdAt`, `completedAt`. Relaciona arquivo do Storage, prévia e processamento idempotente.

### `rules` — Fase 3

Campos: `name`, `priority`, `conditions[]` (`field`, `operator`, `value`), `actions` (`categoryId`, `subcategoryId`, `tags`), `status`, `createdAt`.

### `goals` — Fase 5

Campos: `name`, `targetAmount`, `currentAmount`, `targetDate`, `monthlyContribution`, `priority`, `linkedAccountId`, `progressPercentage`, `status`, `createdAt`, `updatedAt`. Aportes são lançamentos vinculados; `currentAmount` é consolidado por Function.

### `debts` — Fase 5

Campos: `name`, `creditor`, `originalAmount`, `remainingBalance`, `interestRate`, `interestPeriod`, `installmentCount`, `paidInstallments`, `installmentAmount`, `startDate`, `estimatedEndDate`, `status`, `createdAt`, `updatedAt`.

### `investments` — Fase 5

Campos: `name`, `type`, `institutionName`, `quantity`, `averagePrice`, `investedAmount`, `currentValue`, `liquidity`, `lastPriceUpdateAt`, `status`. Valores monetários são centavos; `quantity` pode ser fracionária.

### `assets` — Fase 5

Campos: `name`, `type`, `purchaseValue`, `estimatedValue`, `includeInNetWorth`, `lastValuationAt`, `status`.

### `subscriptions` — Fase 5

Campos: `name`, `amount`, `frequency`, `nextBillingDate`, `paymentSourceType`, `paymentSourceId`, `categoryId`, `automaticRenewal`, `status`, `createdAt`. Pode referenciar uma recorrência.

### `netWorthHistory` — Fase 5

Histórico mensal identificado por `referenceMonth`. O PDF define o caminho e a fórmula patrimonial, mas não especifica os campos do snapshot.

## Relacionamentos e agregados

- `members/{userId}` liga Authentication ao grupo;
- `transactions.accountId` referencia conta; `categoryId`/`subcategoryId`, categorias;
- duas transações de transferência compartilham `transferId`;
- compras referenciam `cardId` e `invoiceId`;
- parcelas referenciam `installmentPlanId`;
- ocorrências referenciam `recurrenceId`;
- aportes podem referenciar meta e movimentações patrimoniais suas entidades;
- anexos referenciam metadados/caminhos no Storage;
- conta mantém `currentBalance` e `projectedBalance`; cartão, `availableLimit`; fatura, totais; orçamento, consumo; meta, acumulado; resumos mensais e patrimônio, agregados.

## Índices compostos prováveis

| Coleção         | Campos                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| `transactions`  | `competenceDate` com `status`, `accountId`, `cardId`, `invoiceId`, `categoryId`, `ownerId` ou `visibility` |
| `budgets`       | `referenceMonth`, `categoryId`                                                                             |
| `invoices`      | `cardId`, `dueDate`                                                                                        |
| `invoices`      | `cardId`, `status`                                                                                         |
| `notifications` | `userId`, `read`, `createdAt`                                                                              |
| `recurrences`   | `status`, `nextExecutionAt`                                                                                |

O `groupId` está implícito no caminho das subcoleções; consultas `collectionGroup` podem exigir campo desnormalizado e índices adicionais. Índices efetivos são versionados em `firestore.indexes.json` e ajustados às consultas reais.

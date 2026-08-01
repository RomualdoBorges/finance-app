# Lançamentos

Os quatro primeiros itens do Milestone 3 introduzem receitas, despesas, datas, estados e ciclo de vida em `financialGroups/{groupId}/transactions/{transactionId}`.

O documento possui `groupId`, `type`, `description`, `normalizedDescription`, `amountMinor`, `accountId`, `categoryId`, `notes`, `status`, `competenceDate`, `dueDate`, `paymentDate`, `createdBy`, `createdAt` e `updatedAt`. `income` é exibido como “Receita” e `expense` como “Despesa”. Valores são inteiros positivos em centavos BRL; o sinal é derivado do tipo.

`competenceDate` é a data econômica do lançamento, `dueDate` é a data prevista para pagamento ou recebimento e `paymentDate` é a data em que o pagamento ou recebimento ocorreu. As três são datas civis obrigatórias em novas criações, persistidas como strings `YYYY-MM-DD`, sem horário, timezone ou conversão para `Timestamp`. O formulário inicia as três com a data atual do calendário local e permite alterá-las livremente.

Documentos legados podem não conter essas propriedades. Na leitura, ausência é representada por `null`, sem inventar uma data; propriedade presente com valor inválido torna o documento inválido. Não há migração em massa. A lista mostra somente a competência e informa quando ela não existe no legado.

Conta e categoria são obrigatórias, ativas e do mesmo grupo. A categoria também precisa ter o tipo do lançamento. Categorias padrão e personalizadas, raízes e subcategorias ativas são elegíveis. Se uma referência for arquivada entre abertura e envio do formulário, o service rejeita a criação com mensagem clara.

A tela `/lancamentos` usa uma lista provisória dos 50 cadastros mais recentes, ordenada tecnicamente por `createdAt` descendente. Isso não implementa filtros, paginação ou extrato avançado.

As datas não alteram saldos ou agregados e não mudam a ordenação técnica por cadastro; apenas `dueDate` participa da projeção visual de vencido. Ficam adiados: transferência, recorrência, parcelamento, cartões, detalhes completos, atualização de saldos, patrimônio e agregados. Delete físico permanece bloqueado. `usageCount` não é incrementado nesta etapa.
# Estados dos lançamentos

Novos lançamentos persistem um estado de fluxo: `planned`, `pending` ou
`confirmed`; o formulário usa `pending` como padrão. O domínio também reconhece
`canceled`. Nenhum estado altera saldos ou agregados nesta etapa.

`overdue` nunca é persistido. Ele é derivado para exibição quando um lançamento
`pending` tem `dueDate` anterior à data civil atual. Vencimento no dia atual
continua `pending`; estados `planned`, `confirmed` e `canceled` nunca são
exibidos como vencidos. A comparação usa strings civis `YYYY-MM-DD` validadas,
sem conversão de fuso horário.

Documentos legados sem `status` são lidos como `pending` somente em memória e
não são regravados. Um status presente e inválido torna o documento inválido.

## Ciclo de vida e vínculos

Novos documentos persistem um contrato estável: `operationKind` (`normal`, `reversal` ou `refund`) e os campos anuláveis `confirmedAt`, `confirmedBy`, `canceledAt`, `canceledBy`, `cancellationReason`, `reversalOfTransactionId`, `refundOfTransactionId`, `reversedByTransactionId` e `refundedByTransactionId`. Legados usam `normal` e `null` somente em memória; campo presente inválido resulta em `invalid-data`.

| Operação | Planejado/pendente normal | Confirmado normal | Cancelado | Estorno/reembolso |
| --- | --- | --- | --- | --- |
| Editar | sim | não | não | não |
| Confirmar | sim; repetição confirmada é idempotente | sem escrita | não | não |
| Cancelar | sim | sim, sem vínculo posterior | sem escrita | não |
| Estornar/reembolsar | não | sim, uma vez de cada espécie | não | não |

Cancelamento invalida o próprio lançamento e exige motivo. Estorno é uma correção contábil oposta; reembolso é uma devolução financeira oposta e, nesta etapa, somente total. Ambos criam um novo lançamento confirmado, com tipo invertido, mesmo valor e conta, categoria ativa compatível escolhida pelo usuário e vínculo com o original. A criação e a marcação do original são uma única transação Firestore. Não há exclusão física, reembolso parcial, alteração de saldo, conta ou agregado.

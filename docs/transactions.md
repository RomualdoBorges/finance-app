# Lançamentos

O primeiro item do Milestone 3 introduz somente receitas e despesas em `financialGroups/{groupId}/transactions/{transactionId}`.

O documento possui `groupId`, `type`, `description`, `normalizedDescription`, `amountMinor`, `accountId`, `categoryId`, `notes`, `createdBy`, `createdAt` e `updatedAt`. `income` é exibido como “Receita” e `expense` como “Despesa”. Valores são inteiros positivos em centavos BRL; o sinal é derivado do tipo.

Conta e categoria são obrigatórias, ativas e do mesmo grupo. A categoria também precisa ter o tipo do lançamento. Categorias padrão e personalizadas, raízes e subcategorias ativas são elegíveis. Se uma referência for arquivada entre abertura e envio do formulário, o service rejeita a criação com mensagem clara.

A tela `/lancamentos` usa uma lista provisória dos 50 cadastros mais recentes, ordenada tecnicamente por `createdAt` descendente. Isso não implementa filtros, paginação ou extrato avançado.

Ficam adiados: datas de competência/pagamento/vencimento, status, edição, exclusão, confirmação, cancelamento, estorno, reembolso, transferência, recorrência, parcelamento, cartões, detalhes completos, atualização de saldos, patrimônio e agregados. Updates e deletes são bloqueados nas Rules. `usageCount` não é incrementado nesta etapa.

# Regras de negócio

## Valores, datas e consistência

- todo valor monetário é inteiro em centavos; taxas, percentuais e quantidades fracionárias não são dinheiro;
- datas persistidas são `Firestore Timestamp`;
- operações compostas são atômicas e executadas em Cloud Functions;
- Functions, triggers, recorrências e importações são idempotentes;
- o frontend não recalcula saldos ou dashboards varrendo todo o extrato.

## Receitas, despesas e saldos

- receita confirmada aumenta `currentBalance`; despesa confirmada o reduz;
- lançamento pendente afeta `projectedBalance`, não o saldo atual;
- planejados participam apenas das projeções definidas pelo produto, sem se tornarem confirmados implicitamente;
- criação, edição, confirmação, cancelamento, estorno e reembolso ajustam conta, orçamento e resumo de modo consistente e auditável;
- lançamentos vencidos podem ser marcados por Scheduled Function;
- o saldo inicial integra a base consolidada da conta;
- `currentBalance` e `projectedBalance` são atualizados transacionalmente por backend confiável.

## Transferências

- transferência gera exatamente um `transfer_out` na origem e um `transfer_in` no destino, ambos positivos em valor e unidos pelo mesmo `transferId`;
- usuário, acesso às duas contas, contas distintas e valor são validados;
- os dois lançamentos, os dois saldos e a auditoria são gravados em uma única transação atômica;
- transferência não conta como receita nem despesa em relatórios;
- repetição da mesma solicitação não duplica lançamentos nem efeitos.

## Categorias

- categorias podem ser de receita ou despesa e subcategorias usam
  `parentCategoryId`, limitado a uma categoria raiz do mesmo grupo e tipo;
- categoria utilizada deve ser arquivada (`status: archived`), nunca apagada;
- arquivamento preserva o significado do histórico;
- regras automáticas não podem aplicar categoria incompatível com o lançamento.

## Cartões e faturas — Fase 2

- compra no cartão é `card_purchase` e pertence a uma fatura;
- a despesa é reconhecida na compra;
- pagamento de fatura, total ou parcial, é movimentação entre conta e obrigação do cartão e **não gera nova despesa**;
- fechamento impede mudanças indevidas no ciclo;
- troca de vencimento não altera automaticamente faturas já fechadas;
- estorno/refund atualiza compra, fatura, limite e agregados correspondentes;
- pagamento e fechamento são operações de Function, atômicas e idempotentes;
- nunca se armazena número completo, CVV ou senha do cartão.

## Parcelamentos — Fase 2

- uma compra parcelada possui plano com valor total, quantidade e valor de parcela;
- cada parcela é lançamento independente, ligado ao plano, numerado e vinculado à fatura correta;
- a soma das parcelas deve corresponder ao total; o PDF não define como distribuir eventual diferença de centavos, portanto essa regra permanece pendente;
- todas as parcelas são geradas por Cloud Function de modo idempotente; falha parcial não pode deixar plano incompleto.

## Recorrências

- frequências permitidas: diária, semanal, quinzenal, mensal, bimestral, trimestral, semestral, anual e customizada;
- Scheduled Function localiza execuções próximas, cria lançamentos, atualiza `nextExecutionAt` e registra falhas;
- a chave `recurrenceId + referenceDate` impede duas ocorrências iguais;
- confirmação automática e antecedência de geração respeitam a configuração;
- término e inativação impedem novas ocorrências.

## Orçamentos

- orçamento é definido por mês e categoria com `plannedAmount`;
- `spentAmount` representa despesas confirmadas aplicáveis; `pendingAmount`, despesas pendentes;
- `availableAmount` e `usagePercentage` são consolidados;
- estado é `healthy`, `warning`, `reached` ou `exceeded`;
- criar, alterar, confirmar ou cancelar lançamento relacionado atualiza orçamento por Function, sem varrer o extrato no cliente.

## Resumos e dashboard

- `monthlySummaries` consolida receitas, despesas, resultado, confirmados, pendentes, saldos, taxa de poupança e totais por categoria;
- transferências são excluídas de receitas e despesas;
- dashboard consulta resumos, contas, fatura atual, vencimentos, metas e últimos lançamentos;
- edição retroativa atualiza os períodos afetados de forma idempotente.

## Metas — Fase 5

- meta define alvo, prazo, aporte mensal, prioridade e conta opcional;
- aporte é lançamento vinculado à meta;
- `currentAmount` e progresso são consolidados por Function;
- cancelamento/estorno de aporte reverte o progresso consistentemente.

## Dívidas — Fase 5

- dívida preserva valor original, saldo restante, juros, quantidade de parcelas e parcelas pagas;
- pagamento cria despesa, incrementa parcelas pagas, reduz saldo devedor, registra juros/amortização quando informados e atualiza o patrimônio;
- a operação de pagamento atualiza despesa, parcelas, saldo e patrimônio de forma consistente.

## Patrimônio — Fase 5

- patrimônio líquido = ativos financeiros + bens + investimentos - dívidas;
- valores atuais e snapshots mensais são pré-calculados;
- aportes e retiradas de investimento são lançamentos próprios;
- atualização de cotação registra instante da última atualização e não altera custo histórico;
- bens só integram patrimônio quando `includeInNetWorth` for verdadeiro.

## Assinaturas — Fase 5

- assinatura mantém valor, frequência, próxima cobrança, fonte de pagamento e renovação;
- pode ser vinculada a recorrência;
- renovação e cobrança não podem duplicar ocorrência.

## Importações — Fase 3

- upload vai ao Storage, cria registro e dispara processamento; arquivos grandes podem usar Cloud Tasks;
- parser produz prévia e contadores antes da confirmação;
- duplicidades usam chave derivada de data, valor, descrição, conta e identificador bancário;
- confirmar cria lançamentos e atualiza saldos/resumos;
- reprocessar a mesma importação é idempotente;
- linhas inválidas ou duplicadas são reportadas, não confirmadas silenciosamente.

## Categorização automática — Fase 3

- regras possuem prioridade, condições e ações;
- aplicam-se em importações, sincronizações, opcionalmente no cadastro manual e em reprocessamento solicitado;
- reprocessamentos em massa usam Cloud Tasks;
- aplicação repetida é determinística e não duplica lançamentos;
- alterações automáticas preservam auditoria e possibilidade de revisão.

## Grupos e visibilidade — Fase 4

- todo dado financeiro pertence a grupo;
- usuário pode participar de vários grupos e definir padrão;
- grupo mantém ao menos um administrador;
- remover membro não apaga lançamentos antigos;
- `shared` é visível conforme participação e permissão; `private` somente para criador/proprietário e, se a política de produto for definida assim, administradores autorizados.

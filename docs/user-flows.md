# Fluxos do usuário

Os fluxos do MVP e das fases futuras são separados para impedir implementação antecipada.

## MVP — Fase 1

### Cadastro

1. Usuário informa dados, e-mail e senha.
2. Formulário valida os campos; Authentication cria a identidade.
3. Usuário autenticado segue obrigatoriamente à etapa de verificação.
4. Nenhum perfil, senha, token ou credencial financeira é persistido no Firestore nesta etapa.

Também são previstos cadastro/login com Google, recuperação e atualização de senha, logout, exclusão de usuário e MFA quando habilitado.

### Login

1. Usuário autentica por e-mail/senha ou Google.
2. Erros não revelam informações sensíveis.
3. Sessão carrega perfil e grupo padrão/ativo.
4. Perfil incompleto segue ao onboarding; os demais seguem ao dashboard.

### Verificação de e-mail

1. Enquanto `emailVerified` for falso, os guards direcionam o usuário autenticado à etapa própria `/verificar-email`.
2. O usuário solicita explicitamente o envio da mensagem; um intervalo de 60 segundos impede reenvios repetidos pela interface.
3. O cadastro e a autenticação não enviam a mensagem automaticamente.
4. Depois de abrir o link recebido, o usuário solicita a atualização manual do estado.
5. A aplicação recarrega o usuário do Authentication e segue normalmente quando `emailVerified` passa a verdadeiro.

### Onboarding e grupo individual

1. Backend verifica se o onboarding já foi processado.
2. Cria idempotentemente perfil, grupo `individual` e membro `owner`.
3. Define o grupo como ativo/padrão.
4. Usuário configura moeda/localidade quando necessário e cria a primeira conta.
5. Repetição não cria perfil, grupo ou participação duplicados.

### Contas

1. Usuário abre contas, cria ou edita nome, instituição, tipo, saldo inicial e opções de consolidação.
2. Aplicação converte dinheiro para centavos e valida.
3. Operação salva a conta sem permitir escrita arbitrária nos saldos consolidados.
4. Lista exibe saldo atual e projetado.
5. Conta com histórico é arquivada, preservando lançamentos.

### Categorias

1. Usuário consulta categorias padrão/personalizadas.
2. Cria ou edita nome, tipo, categoria-pai, ícone, cor, ordem e marcadores.
3. Categoria usada é arquivada, não apagada.
4. Categorias arquivadas permanecem nos lançamentos históricos.

### Receita

1. Usuário informa conta, categoria, valor, descrição, datas, status e dados opcionais.
2. Formulário valida e converte o valor para centavos.
3. Lançamento simples autorizado é criado.
4. Confirmado aumenta saldo atual; pendente afeta saldo projetado.
5. Conta e resumo mensal são atualizados consistentemente.

### Despesa

1. Usuário informa conta, categoria, valor, descrição, datas, status e dados opcionais.
2. Formulário valida e converte o valor para centavos.
3. Lançamento é criado.
4. Confirmado reduz saldo atual; pendente afeta saldo projetado.
5. Conta, orçamento e resumo mensal são atualizados.

Edição, confirmação, cancelamento ou reembolso repetem a atualização consistente e auditável dos agregados afetados.

### Transferência

1. Usuário escolhe contas distintas, valor e data.
2. Frontend chama a Cloud Function com identidade/chave idempotente.
3. Function valida usuário, grupo, acesso às duas contas e valor.
4. Transação Firestore cria `transfer_out` e `transfer_in` com o mesmo `transferId`, atualiza as duas contas e registra auditoria.
5. Extrato exibe ambos os lados; relatórios não contam a transferência como receita/despesa.
6. Falha reverte tudo; repetição não duplica efeitos.

### Extrato

1. Usuário escolhe grupo e período.
2. Lista carrega lote limitado, ordenado, sem baixar a coleção inteira.
3. Filtros incluem conta, categoria, tipo e status.
4. Próxima página usa cursor `startAfter`.
5. Usuário abre detalhes e ações permitidas.
6. Loading, erro, vazio e fim da lista são explícitos.

### Dashboard

1. Usuário seleciona mês.
2. Tela consulta `monthlySummaries`, contas, próximos vencimentos e últimos lançamentos.
3. Mostra receitas, despesas, resultado, confirmados/pendentes, saldos, taxa de poupança e categorias.
4. Indicadores levam a listas filtradas quando aplicável.
5. Dashboard nunca reconstrói saldos varrendo o extrato.

### Orçamento

1. Usuário escolhe mês, categoria e valor planejado.
2. Valor é validado em centavos.
3. Backend mantém gasto, pendente, disponível, percentual e estado.
4. Alterações de lançamentos recalculam somente agregados afetados.
5. Interface sinaliza saudável, alerta, atingido ou excedido.

### Recorrência

1. Usuário define tipo, conta, categoria, valor, frequência, intervalo, início/fim, antecedência e confirmação automática.
2. Recorrência é salva com `nextExecutionAt`.
3. Scheduled Function encontra ocorrências próximas.
4. Cria lançamento com chave `recurrenceId + referenceDate`, avança a execução e registra falhas.
5. Reexecução não duplica ocorrência.

### Exportação CSV

1. Usuário escolhe período e filtros.
2. Aplicação/Function valida acesso e gera CSV somente com dados autorizados.
3. Valores e datas são exportados de modo consistente e documentado.
4. Usuário baixa o arquivo; exportação temporária é removida quando aplicável.

## Fase 2 — cartões

### Cartão e fatura

1. Usuário cadastra identificação segura, limite, fechamento, vencimento e conta de pagamento.
2. Compra é vinculada à fatura do ciclo e reduz limite disponível.
3. Fatura passa por futura, aberta, fechada, parcialmente paga, paga, vencida ou cancelada.
4. Fechamento por Function protege o ciclo.
5. Alterar vencimento não muda automaticamente fatura já fechada.

### Pagamento e estorno

1. Usuário seleciona fatura, conta e valor.
2. Function valida e registra `invoice_payment`, atualiza conta, fatura e limite atomicamente.
3. Pagamento não cria nova despesa, pois ela foi reconhecida na compra.
4. Estorno atualiza compra, fatura, limite e resumos correspondentes.

### Parcelamento

1. Usuário informa cartão, compra, total, quantidade, categoria e data.
2. Function cria o plano e todas as parcelas; eventual diferença de centavos aguarda regra de distribuição definida.
3. Cada parcela recebe número, total, plano e fatura.
4. Reexecução não duplica parcelas; falha não deixa plano parcial.

## Fase 3 — importação e automação

### Importação CSV/OFX

1. Usuário escolhe conta e envia arquivo ao Storage.
2. Documento de importação é criado e Function processa; arquivos grandes seguem para Cloud Tasks.
3. Sistema interpreta, aplica regras, detecta duplicidades e exibe prévia e contadores.
4. Usuário revisa e confirma.
5. Function cria apenas linhas aprovadas e atualiza saldos/resumos.
6. Reprocessamento não duplica lançamentos.

### Regras de categorização

1. Usuário define nome, prioridade, condições e ações.
2. Regras são aplicadas em importações/sincronizações e, opcionalmente, no cadastro manual.
3. Usuário revisa resultados.
4. Reprocessamento em massa usa Cloud Tasks e mantém auditoria.

## Fase 4 — uso familiar

### Convites e grupos

1. `owner`/`admin` autorizado convida por fluxo de backend.
2. Destinatário autentica e aceita convite válido.
3. Function cria participação com papel/permissões e atualiza o grupo.
4. Usuário alterna entre grupos e define um padrão.
5. Remoção revoga acesso sem apagar lançamentos antigos e nunca deixa grupo sem administrador.

### Compartilhamento

1. Criador escolhe `private` ou `shared`.
2. Shared segue permissões do grupo; private fica restrito à política de menor privilégio.
3. Fluxos futuros permitem despesas compartilhadas, divisão proporcional, reembolsos e acertos.

## Fase 5 — patrimônio

Fluxos futuros incluem criação e acompanhamento de metas/aportes, cadastro e pagamento de dívidas, assinaturas recorrentes, investimentos e retiradas, avaliação de bens e consulta ao histórico do patrimônio líquido.

## Fase 6 — Open Finance

Usuário escolhe provedor autorizado, concede consentimento, seleciona contas, acompanha sincronizações e renova/revoga consentimento. O sistema trata falhas, evita duplicidades e oferece conciliação bancária.

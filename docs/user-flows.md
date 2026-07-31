# Fluxos do usuário

Os fluxos do MVP e das fases futuras são separados para impedir implementação antecipada.

## MVP — Fase 1

### Cadastro

1. Usuário informa dados, e-mail e senha.
2. Formulário valida os campos; Authentication cria a identidade.
3. Usuário autenticado segue obrigatoriamente à etapa de verificação.
4. Após a autenticação, a aplicação garante idempotentemente o perfil básico em `users/{uid}`; senha, token e credencial financeira não são persistidos.

Também são previstos recuperação e atualização de senha, logout e exclusão da identidade autenticada. Login com Google foi removido do escopo; MFA permanece futuro.

### Login

1. Usuário autentica por e-mail/senha ou Google.
2. Erros não revelam informações sensíveis.
3. Sessão carrega perfil e grupo padrão/ativo.
4. Perfil incompleto segue ao onboarding; os demais seguem ao dashboard.

Ao abrir uma rota protegida sem sessão, a aplicação aguarda a resolução do Auth e
redireciona para `/entrar`, preservando internamente pathname, query e hash. Após
o login, usuários verificados retornam a esse destino; usuários não verificados
seguem para `/verificar-email` sem perder o destino, que é restaurado após a
confirmação real. Destinos externos ou malformados são descartados e usam `/`.
O carregamento e o erro do documento básico do usuário não bloqueiam as rotas.

### Verificação de e-mail

1. Enquanto `emailVerified` for falso, os guards direcionam o usuário autenticado à etapa própria `/verificar-email`.
2. O usuário solicita explicitamente o envio da mensagem; um intervalo de 60 segundos impede reenvios repetidos pela interface.
3. O cadastro e a autenticação não enviam a mensagem automaticamente.
4. Depois de abrir o link recebido, o usuário solicita a atualização manual do estado.
5. A aplicação recarrega o usuário do Authentication e segue normalmente quando `emailVerified` passa a verdadeiro.

### Documento do usuário

1. O listener existente do Authentication publica o usuário autenticado.
2. O provider consulta `users/{uid}` sem criar outro listener de autenticação ou do Firestore.
3. Se não existir, cria dados básicos com timestamps do servidor.
4. Se existir, sincroniza somente dados básicos alterados, preservando `createdAt` e campos futuros.
5. Sem alterações, não escreve nem altera `updatedAt`.
6. Em falha, a sessão e o conteúdo continuam disponíveis; um aviso permite tentar novamente.

Não há edição manual de perfil, avatar, grupos ou dados financeiros nesta etapa.

### Atualização de senha

1. Usuário autenticado, com e-mail disponível e verificado, acessa “Alterar senha”.
2. Informa a senha atual, a nova senha e a confirmação da nova senha.
3. Authentication reautentica o usuário com a credencial de e-mail e senha atual.
4. Somente após a reautenticação, Authentication atualiza a senha.
5. Em caso de sucesso, o formulário é limpo e a sessão permanece autenticada na mesma página.
6. Senha atual incorreta ou outra falha segura mantém os campos somente no estado local para correção e nova tentativa.

### Exclusão da conta

1. Usuário autenticado, com e-mail disponível e verificado, acessa `/conta/excluir`.
2. Informa a senha atual e marca a confirmação de que entende que a ação é permanente.
3. Authentication reautentica o usuário com a credencial de e-mail e senha.
4. Somente após a reautenticação, Authentication exclui a identidade.
5. A aplicação executa o fluxo de logout existente; a observação da sessão e os guards redirecionam para o login.
6. Em caso de falha, a página não navega e permite nova tentativa sem persistir a senha.

Nesta etapa, a exclusão remove somente a conta do Firebase Authentication. O documento `users/{uid}` não é removido temporariamente, e ainda não existem dados financeiros a limpar. Alteração de senha e exclusão compartilham contratos de reautenticação preparados para uma futura segunda etapa, mas MFA ainda não está implementado.

### Onboarding e grupo individual

1. Nesta etapa, o caso de uso do cliente verifica se o bootstrap já foi processado; uma Cloud Function não foi criada.
2. Cria idempotentemente perfil, grupo `personal` e membro `owner` em `financialGroups/{groupId}/members/{uid}`.
3. Define o grupo como ativo/padrão.
4. O ID inicial é determinístico, mas leituras posteriores usam `activeGroupId` explicitamente.
5. Repetição não cria perfil, grupo ou participação duplicados nem altera timestamps.

### Contas

1. Usuário abre contas e cria ou edita nome, descrição, instituição, ícone e cor.
2. Aplicação normaliza o nome e valida duplicidade entre contas ativas.
3. Usuário confirma o arquivamento; a conta permanece visível no gerenciamento.
4. Ao restaurar, a duplicidade é validada novamente.
5. Não há exclusão física. Tipos, opções de consolidação e saldos ficam para os
   próximos itens do roadmap.

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

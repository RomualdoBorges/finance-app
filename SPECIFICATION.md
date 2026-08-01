# Especificação do produto

Este documento deriva da especificação técnica oficial em `docs/architecture/specification.pdf`. O PDF prevalece em caso de divergência.

## 1. Visão do produto

Aplicação web responsiva, em português brasileiro, para controle financeiro pessoal e, em fases posteriores, familiar. O produto abrange contas bancárias e dinheiro, receitas, despesas, transferências, planejamento mensal, recorrências, cartões, importações, automação, metas, dívidas, assinaturas, investimentos, bens, patrimônio, relatórios e compartilhamento.

As primeiras fases usam serviços gerenciados do Firebase, sem servidor backend tradicional. Todo dado financeiro pertence a um grupo financeiro; inclusive o usuário individual possui um grupo próprio.

## 2. Stack oficial

### Frontend

- React, TypeScript em modo estrito e Vite;
- React Router;
- TanStack Query para dados remotos e cache;
- Zustand somente para estado global de interface;
- React Hook Form e Zod;
- Tailwind CSS, Radix UI e Lucide React;
- Recharts ou Apache ECharts;
- `date-fns`;
- Vitest, Testing Library e Playwright.

### Plataforma e serviços

- Firebase Authentication, Cloud Firestore, Cloud Functions, Cloud Storage, Firebase Hosting, Firebase Cloud Messaging, Firebase App Check e Local Emulator Suite;
- Firebase Performance Monitoring;
- Firebase Analytics opcional;
- Crashlytics reservado a uma futura aplicação mobile;
- quando necessários: Cloud Scheduler, Cloud Tasks, Secret Manager, Google Cloud Logging, Google Cloud Monitoring, serviço externo de e-mail, provedor de Open Finance e API de cotações.

## 3. Requisitos transversais

- Valores monetários são números inteiros em centavos; nunca ponto flutuante.
- Datas persistidas são `Firestore Timestamp`; mês de referência pode usar `YYYY-MM`.
- Senhas, hashes, tokens de autenticação, credenciais bancárias, CVV e senhas de cartão não são persistidos no Firestore.
- Leituras e escritas simples autorizadas podem ocorrer pelo frontend; operações compostas, privilegiadas ou que alterem vários documentos passam por Cloud Functions.
- Transferências, pagamentos de fatura, parcelas, importações, convites, permissões, exclusão de grupo e recálculo de saldo são operações de backend.
- Saldos `currentBalance` e `projectedBalance`, orçamentos e resumos são consolidados por processos confiáveis. O navegador não varre o extrato para recalculá-los.
- Functions, triggers, recorrências e importações devem ser idempotentes.
- Security Rules negam por padrão e liberam apenas operações explicitamente autorizadas.
- Listas usam filtros, ordenação, limite e paginação por cursor (`startAfter`), sem carregar coleções inteiras ou usar grandes deslocamentos.
- Existem projetos Firebase separados para desenvolvimento, staging e produção, cada qual com Authentication, Firestore, Storage, Functions, configurações, variáveis e secrets próprios.
- Desenvolvimento e testes usam os emuladores de Authentication, Firestore, Functions, Storage e Hosting; testes automatizados simulam serviços externos e nunca acessam produção.

## 4. MVP — Fase 1: uso individual

### Autenticação e perfil

- Cadastro, login e logout com e-mail e senha;

<!-- Login com Google removido do escopo do projeto. -->

- recuperação de senha, verificação de e-mail e atualização de senha;
- exclusão de usuário;
- preparação arquitetural para autenticação multifator futura;
- perfil com nome, e-mail, foto, moeda, localidade, fuso horário e estado do onboarding.

### Onboarding e grupo

- Criação idempotente do perfil, grupo `individual` e participação `owner`;
- seleção do grupo ativo/padrão;
- isolamento integral entre grupos.

### Contas e categorias

- Contas dos tipos `checking`, `savings`, `cash`, `digital_wallet`, `payment`, `investment`, `joint` e `other`;
- saldo inicial, atual e projetado, moeda, titular, status e indicadores de inclusão em saldo disponível e patrimônio;
- criação, edição e arquivamento de contas;
- categorias e subcategorias de receita ou despesa, com nome, tipo, ícone, cor, ordem, essencialidade e natureza fixa;
- categorias utilizadas são arquivadas, nunca apagadas definitivamente.

### Lançamentos e transferências

- Receitas e despesas com descrição, valor, datas de competência, pagamento e vencimento, status, conta, categoria, proprietário, criador, visibilidade, forma de pagamento, estabelecimento, tags, notas e anexos;
- estados `planned`, `pending`, `confirmed`, `overdue`, `cancelled`, `refunded` e `partially_refunded`, conforme aplicável;
- lançamentos confirmados afetam o saldo atual; pendentes afetam o saldo projetado;
- edição, cancelamento e estorno atualizam saldos, orçamento e resumo de forma consistente;
- transferência cria `transfer_out` e `transfer_in` com o mesmo `transferId`, atualiza as duas contas e registra auditoria em uma única transação atômica;
- transferências não contam como receita ou despesa.

### Extrato, dashboard e planejamento

- Extrato paginado por cursor, com filtros de período, conta, categoria, tipo e status;
- dashboard mensal baseado principalmente em `monthlySummaries`, contas, próximos vencimentos, metas aplicáveis e últimos lançamentos;
- resumo mensal com receitas, despesas, resultado, totais confirmados e pendentes, saldos disponível e projetado, taxa de poupança e totais por categoria;
- orçamento básico por mês e categoria, com planejado, gasto, pendente, disponível, percentual e estados `healthy`, `warning`, `reached` e `exceeded`;
- recorrências com frequências diária, semanal, quinzenal, mensal, bimestral, trimestral, semestral, anual ou customizada; geração antecipada configurável e confirmação automática opcional;
- unicidade de ocorrência por `recurrenceId + referenceDate`;
- exportação CSV;
- tema claro e escuro, responsividade para desktop e celular e estados de loading, erro, vazio e sucesso.

### Plataforma do MVP

- Firebase Hosting para a SPA, com HTTPS, CDN, rewrite para `index.html`, preview channels, rollback e CI/CD;
- Security Rules testadas, App Check e observabilidade de Functions;
- testes unitários, de componentes, ponta a ponta, Rules, Functions, transações, idempotência e papéis, todos os testes Firebase aplicáveis executados nos emuladores.

## 5. Fase 2 — cartões

- cadastro de cartões apenas com nome, instituição, bandeira, quatro últimos dígitos, titular, limite, limite disponível, fechamento, vencimento e conta de pagamento;
- faturas futuras, abertas, fechadas, parcialmente pagas, pagas, vencidas ou canceladas;
- compras vinculadas à fatura e reconhecimento da despesa na compra;
- fechamento protegido contra alterações indevidas no ciclo;
- pagamento total ou parcial de fatura como movimentação entre conta e obrigação, sem gerar nova despesa;
- estornos refletidos na compra e na fatura;
- mudança de vencimento sem alterar automaticamente faturas já fechadas;
- parcelamentos gerados por Function, com plano e um lançamento independente por parcela;
- calendário financeiro, notificações e projeção de saldo.

## 6. Fase 3 — importação e automação

- importação CSV e OFX por Cloud Storage e Functions, com Cloud Tasks para arquivos grandes;
- estados e contadores de linhas importadas, ignoradas, duplicadas e com erro;
- prévia para conferência antes da confirmação;
- idempotência e deduplicação por data, valor, descrição, conta e identificador bancário;
- regras de categorização priorizadas, com condições e ações, aplicadas a importações, sincronizações, cadastro manual opcional e reprocessamentos;
- reprocessamentos em massa por Cloud Tasks;
- exportações XLSX e PDF.

## 7. Fase 4 — uso familiar

- grupos `couple` e `family`, além de `individual`;
- convites e participação em múltiplos grupos;
- papéis `owner`, `admin`, `member` e `viewer`, com permissões sensíveis verificadas nas Rules e Functions;
- somente administradores convidam ou removem participantes; todo grupo conserva pelo menos um administrador;
- remoção de membro preserva seus lançamentos históricos;
- lançamentos `private` e `shared`;
- despesas compartilhadas, divisão proporcional, reembolsos e acerto entre participantes.

## 8. Fase 5 — patrimônio

- metas com valor-alvo, acumulado consolidado, prazo, aporte mensal, prioridade, conta vinculada e progresso;
- aportes registrados como lançamentos vinculados;
- dívidas com credor, principal, saldo devedor, juros, parcelas e prazo; pagamento atualiza despesa, parcelas pagas, saldo e patrimônio;
- assinaturas, renovação automática, próxima cobrança e vínculo opcional com recorrência;
- investimentos com quantidade, preço médio, valor investido, valor atual, liquidez e cotação;
- bens com valor de compra, estimativa atual e opção de inclusão no patrimônio;
- patrimônio líquido pré-calculado como ativos financeiros + bens + investimentos - dívidas;
- histórico mensal patrimonial e integração com cotações.

## 9. Fase 6 — Open Finance

- integração com provedor autorizado;
- consentimentos e renovação;
- sincronização bancária e histórico das sincronizações;
- tratamento de falhas;
- conciliação bancária.

## 10. Arquivos, notificações e auditoria

- Storage guarda comprovantes, recibos, boletos, extratos, faturas, imagens de metas, importações e exportações temporárias;
- caminhos são derivados de IDs seguros, arquivos têm tamanho e tipo limitados, URLs privadas não são públicas permanentemente e metadados ficam no Firestore;
- arquivos órfãos são removidos periodicamente;
- notificações internas, FCM e e-mail externo cobrem vencimentos, faturas, orçamentos, saldo projetado, assinaturas, metas, importações e integrações; push mobile fica para fase futura;
- auditorias confiáveis registram ator, ação, entidade, antes/depois, origem e instante; o frontend não pode editá-las nem apagá-las.

## 11. Desempenho, custos e consistência

- dashboard e relatórios frequentes usam documentos agregados;
- extratos são paginados, listeners em coleções grandes são evitados e desligados fora da tela ativa;
- apenas o período selecionado é carregado, com limites máximos de consulta e cache local;
- agregações pesadas ficam nas Functions;
- desnormalização controlada pode incluir nomes de categoria, conta e cartão, totais mensais e por categoria, saldos, percentual de orçamento e progresso de meta;
- uso, custos e alertas de orçamento da plataforma são monitorados.

## 12. CI/CD

Em pull requests: instalação com `pnpm`, typecheck, ESLint, testes unitários, Rules, Functions, build e preview do Hosting. Na branch principal: todos os testes, build de produção e deploy de Rules, índices, Storage Rules, Functions e Hosting. Produção usa credenciais seguras e ambientes protegidos.

## 13. Decisões técnicas principais

- Cloud Firestore, e não Realtime Database inicialmente, por consultas temporais e compostas, paginação, organização por domínio, offline e integração com Firebase.
- Modelagem NoSQL orientada às consultas, com documentos pequenos, agregação e desnormalização controlada.
- Frontend não é autoridade para saldos, permissões, operações compostas ou auditoria.
- Operações críticas em Cloud Functions e transações Firestore.
- Dinheiro em centavos, datas em Timestamp e agregados pré-calculados.
- Hosting tradicional é suficiente para a SPA; App Hosting só ganha relevância com eventual framework full-stack e renderização no servidor.

## 14. Critérios de aceite técnicos do MVP

- Nenhum usuário acessa dados de outro grupo ou dados privados sem autorização.
- Saldos permanecem consistentes após criar, editar, confirmar e cancelar lançamentos.
- Transferências atualizam as duas contas atomicamente e não entram no resultado.
- Dashboard funciona sem ler todo o extrato.
- Recorrências e reexecuções de Functions não duplicam efeitos.
- Valores monetários não sofrem erros de precisão.
- Security Rules têm testes automatizados nos emuladores.
- Aplicação, Functions, Storage e fluxos relevantes funcionam com a Emulator Suite.
- Frontend funciona adequadamente em desktop e celular.
- Ambientes dev, staging e produção são separados.
- Usuário exporta seus dados em CSV.
- Deploy é automatizado e falhas/logs de Functions podem ser acompanhados.
- Compra parcelada gera todas as parcelas, pagamento de fatura não duplica despesa, importação não duplica lançamentos e lançamentos privados são isolados quando suas fases forem entregues.

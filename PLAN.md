# Plano de implementação

Nenhum item está concluído por existir no template. Checkboxes só são marcados após implementação e validação. Cartões começam apenas quando contas, lançamentos, transferências e resumos estiverem estáveis.

## Milestone 0 — Fundação e ambientes

- [x] React, TypeScript strict e Vite
- [x] `pnpm` como gerenciador exclusivo
- [x] React Router
- [x] TanStack Query
- [x] Zustand
- [x] React Hook Form
- [x] Zod
- [x] Tailwind CSS
- [x] Radix UI
- [x] Lucide React
- [x] Biblioteca de gráficos e `date-fns`
- [x] Firebase SDK e camada de repositories/services
- [x] Estrutura por features, providers, layouts e guards
- [x] Vitest, Testing Library, Playwright e mocks de repositories
- [x] Emulator Suite para Auth, Firestore, Functions, Storage e Hosting
- [x] Variáveis públicas validadas e secrets fora do frontend
- [x] Shell responsivo, tema claro/escuro e estados de interface
- [x] CI com typecheck, lint, testes e build

## Fase 1 — MVP individual

### Milestone 1 — Autenticação e onboarding

- [x] Cadastro/login por e-mail e senha

<!-- Login com Google removido do escopo do projeto. -->

- [ ] Autenticação complementar
  - [x] Logout
  - [x] Recuperação de senha
  - [x] Verificação de e-mail
  - [x] Atualização de senha
- [x] Exclusão de usuário e preparação para MFA
- [x] Documento do usuário
- [ ] Rotas protegidas
- [ ] Criação idempotente do grupo individual e membro owner
- [ ] Grupo ativo/padrão

### Milestone 2 — Categorias e contas

- [ ] Categorias padrão, personalizadas e subcategorias
- [ ] Criação, edição e arquivamento de categoria usada
- [ ] Cadastro, edição e arquivamento de contas
- [ ] Tipos e opções de inclusão em saldo/patrimônio
- [ ] Saldo inicial
- [ ] Campos consolidados atual e projetado protegidos

### Milestone 3 — Lançamentos e extrato

- [ ] Receitas e despesas
- [ ] Datas de competência, pagamento e vencimento
- [ ] Estados planejado, pendente, confirmado, vencido e cancelado
- [ ] Edição, confirmação, cancelamento, estorno e reembolso aplicáveis
- [ ] Atualização consistente de saldos e agregados
- [ ] Extrato com filtros, ordenação, limites e paginação `startAfter`
- [ ] Detalhes e estados loading/erro/vazio

### Milestone 4 — Transferências atômicas

- [ ] Callable Function com autenticação e autorização
- [ ] `transfer_out` e `transfer_in` vinculados
- [ ] Atualização das duas contas numa transação Firestore
- [ ] Exclusão de transferências dos resultados
- [ ] Idempotência e auditoria
- [ ] Testes de falha parcial e repetição

### Milestone 5 — Resumos e dashboard

- [ ] `monthlySummaries`
- [ ] Triggers idempotentes para criação, edição e cancelamento
- [ ] Receitas, despesas, resultado, confirmados e pendentes
- [ ] Saldos disponível/projetado e taxa de poupança
- [ ] Totais por categoria
- [ ] Dashboard sem varrer o extrato
- [ ] Últimos lançamentos e próximos vencimentos
- [ ] Gráficos acessíveis

### Milestone 6 — Orçamentos

- [ ] Orçamento mensal por categoria
- [ ] Gasto, pendente, disponível e percentual consolidados
- [ ] Estados healthy, warning, reached e exceeded
- [ ] Atualização idempotente por alterações de lançamentos

### Milestone 7 — Recorrências

- [ ] Frequências e intervalo customizado
- [ ] Próxima execução, antecedência e confirmação automática
- [ ] Scheduled Function
- [ ] Unicidade `recurrenceId + referenceDate`
- [ ] Registro de falhas e testes de idempotência

### Milestone 8 — Exportação e preparação do MVP

- [ ] Exportação CSV autorizada
- [ ] Security Rules e Storage Rules com negação por padrão
- [ ] Testes de Rules, Functions, transações, idempotência e papéis nos emuladores
- [ ] App Check em monitoramento e depois enforcement
- [ ] Firebase Hosting com SPA rewrite e preview channels
- [ ] FCM/central interna somente no escopo necessário do roadmap
- [ ] Logging, Monitoring e Performance Monitoring
- [ ] Acessibilidade e responsividade desktop/celular
- [ ] Alertas de custo, limites de consultas e paginação
- [ ] Pipeline de deploy por ambiente e rollback

## Fase 2 — cartões

### Milestone 9 — Cartões e faturas

- [ ] Cadastro seguro de cartão e limite consolidado
- [ ] Ciclos e estados de fatura
- [ ] Compras vinculadas à fatura
- [ ] Fechamento idempotente
- [ ] Pagamento total/parcial sem duplicar despesa
- [ ] Estornos e atualização do limite
- [ ] Testes de consistência e troca de vencimento

### Milestone 10 — Parcelamentos, calendário e alertas

- [ ] Planos e geração atômica/idempotente de parcelas
- [ ] Definição e implementação da distribuição de eventual diferença de centavos
- [ ] Calendário financeiro
- [ ] Notificações de fechamento/vencimento
- [ ] Projeção de saldo

## Fase 3 — importação e automação

### Milestone 11 — Importações

- [ ] Cloud Storage e metadados
- [ ] CSV e OFX
- [ ] Prévia e contadores
- [ ] Detecção de duplicidades
- [ ] Confirmação idempotente
- [ ] Cloud Tasks para arquivos extensos
- [ ] Limpeza de arquivos órfãos

### Milestone 12 — Regras e exportações avançadas

- [ ] Categorização automática e prioridades
- [ ] Regras personalizadas
- [ ] Reprocessamento por Cloud Tasks
- [ ] Exportação XLSX e PDF

## Fase 4 — uso familiar

### Milestone 13 — Grupos compartilhados

- [ ] Grupos couple/family e participação múltipla
- [ ] Convites
- [ ] Papéis owner, admin, member e viewer
- [ ] Permissões e garantia de administrador mínimo
- [ ] Lançamentos private/shared
- [ ] Remoção de membro preservando histórico

### Milestone 14 — Acertos

- [ ] Despesas compartilhadas
- [ ] Divisão proporcional
- [ ] Reembolsos
- [ ] Acerto entre participantes

## Fase 5 — patrimônio

### Milestone 15 — Planejamento patrimonial

- [ ] Metas e aportes
- [ ] Dívidas, juros, amortização e parcelas
- [ ] Assinaturas
- [ ] Investimentos e movimentações
- [ ] Bens
- [ ] Patrimônio líquido consolidado e histórico mensal
- [ ] Integração com cotações

## Fase 6 — Open Finance

### Milestone 16 — Integração bancária

- [ ] Provedor autorizado e secrets seguros
- [ ] Consentimentos e renovação
- [ ] Sincronização e histórico
- [ ] Idempotência e tratamento de falhas
- [ ] Conciliação bancária

## Qualidade contínua

- [ ] Consultas com filtros, limites, índices e cursores
- [ ] Nenhum listener desnecessário em coleção grande
- [ ] Auditoria confiável para operações críticas
- [ ] Testes de isolamento, visibilidade e campos protegidos
- [ ] Observabilidade de Functions e integrações
- [ ] CI de PR com typecheck, lint, testes, build e preview
- [ ] Deploy da branch principal para Rules, índices, Storage Rules, Functions e Hosting

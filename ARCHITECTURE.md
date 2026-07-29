# Arquitetura

Arquitetura oficial da aplicação web responsiva descrita em `docs/architecture/specification.pdf`.

## Visão geral

```text
Usuário
  -> React + TypeScript + Vite
      -> Firebase Authentication
      -> Cloud Firestore
      -> Cloud Storage
      -> Callable/HTTP Cloud Functions
      -> Firebase Cloud Messaging
      -> Firebase App Check
```

As primeiras fases não usam backend tradicional. O frontend acessa diretamente apenas operações simples permitidas; operações compostas, privilegiadas ou multi-documento passam por Cloud Functions.

## Responsabilidades

### Frontend

- renderizar interface, rotas, formulários, gráficos e relatórios;
- manter estado local e global de UI;
- consultar dados autorizados com filtros, limites, cursores e cache;
- criar lançamentos simples e atualizar preferências/dados sem cálculo crítico quando as Rules autorizarem;
- oferecer offline apenas em áreas apropriadas;
- chamar Functions para transferências, parcelas, faturas, importações, convites, permissões, recálculos e demais operações críticas;
- nunca atualizar saldos, agregados, limites consolidados ou auditoria diretamente.

Páginas e componentes visuais dependem de hooks/casos de uso e repositories/services; não acessam Firebase diretamente.

### Firebase Authentication

Gerencia cadastro e login por e-mail/senha, Google, sessões, verificação de e-mail, recuperação e atualização de senha, exclusão de usuário e MFA quando habilitado. `request.auth.uid` é a referência primária do usuário. Autenticação não substitui autorização por grupo.

### Cloud Firestore

Persiste perfis, grupos e subcoleções financeiras. A modelagem é NoSQL, orientada a consultas, com desnormalização controlada. Mantém saldos e resumos consolidados para evitar varreduras do extrato. Consultas usam índices versionados em `firestore.indexes.json`, paginação `startAfter`, filtros, ordenação e limites.

### Cloud Functions

- transferências atômicas;
- compras parceladas, fechamento e pagamento de faturas;
- geração idempotente de recorrências;
- importações, deduplicação e confirmação;
- atualização transacional de saldos, orçamentos, limites e resumos;
- convites, papéis e permissões;
- notificações e integrações externas;
- cotações, rotinas agendadas e auditoria confiável.

Callable/HTTP Functions atendem ações do frontend. Triggers reagem a alterações e devem ser idempotentes. Scheduled Functions geram recorrências, marcam atrasos, fecham faturas, verificam vencimentos, atualizam investimentos, removem arquivos órfãos e geram snapshots. Task Queue Functions processam importações extensas, recategorização, exportações e integrações com limites.

### Cloud Storage

Guarda comprovantes, recibos, boletos, extratos, faturas, imagens de metas, arquivos importados e exportações temporárias. Caminhos são associados a usuário/grupo/entidade; tamanho e MIME são limitados; nomes fornecidos pelo usuário não viram caminhos; arquivos privados não têm URL pública permanente; metadados ficam no Firestore.

### Security Rules

Negam por padrão e autorizam explicitamente por autenticação, grupo, papel, permissão, propriedade e visibilidade. Validam esquema e impedem que clientes alterem campos protegidos. Não substituem validações de domínio nas Functions.

### Firebase App Check

Protege Firestore, Storage, Callable Functions e serviços compatíveis contra clientes ilegítimos. Entra primeiro em monitoramento e depois em enforcement validado por ambiente. Complementa Authentication, Rules e validações do backend.

### Firebase Hosting

Hospeda `dist` como SPA, com rewrite para `index.html`, HTTPS, CDN, domínio padrão/customizado, preview channels, rollback e CI/CD. Hosting tradicional atende ao Vite; App Hosting fica reservado a eventual adoção de SSR/full-stack.

### Firebase Cloud Messaging

Entrega notificações web; a central interna permanece no Firestore e e-mail usa serviço externo. Push mobile pertence a fase futura.

### Emulator Suite

Em desenvolvimento e testes executa Authentication, Firestore, Functions, Storage e Hosting. Serviços externos são simulados, e o ambiente local nunca acessa produção.

## Fronteira entre operações

Operações simples autorizáveis por documento podem usar repositories do frontend: consultas, preferências, leitura de contas/categorias/relatórios e cadastro manual simples.

Devem passar por Cloud Functions: transferências, compras parceladas, pagamento/fechamento de fatura, importações, convites, gerenciamento de permissões, exclusão de grupo, recálculo de saldos e qualquer alteração financeira de vários documentos.

## Organização do frontend por features

```text
src/
  app/
    router/
    providers/
    layouts/
    guards/
  components/
    ui/
    shared/
  features/
    auth/
    dashboard/
    accounts/
    transactions/
    categories/
    cards/
    invoices/
    budgets/
    recurrences/
    goals/
    debts/
    investments/
    subscriptions/
    imports/
    reports/
    family/
    settings/
  firebase/
    app.ts
    auth.ts
    firestore.ts
    functions.ts
    storage.ts
    messaging.ts
  hooks/
  lib/
  schemas/
  stores/
  types/
  utils/
```

Cada feature separa páginas/componentes, schemas, casos de uso e acesso remoto. Regras puras ficam fora da camada visual.

## Estado no frontend

| Natureza | Responsável |
| --- | --- |
| Dados do Firestore e cache de servidor | TanStack Query |
| Sessão Firebase | Auth Provider |
| Estado global da UI | Zustand |
| Formulários | React Hook Form |
| Validação | Zod |
| Filtros compartilháveis | URL |
| Estado local | `useState` |

Zustand não replica coleções do Firestore.

## Consistência e agregação

- dinheiro é inteiro em centavos e datas são `Timestamp`;
- `currentBalance` e `projectedBalance` são atualizados com transações Firestore;
- transferências criam dois lançamentos e atualizam duas contas numa transação atômica;
- `monthlySummaries`, campos calculados de orçamento, limites, metas e patrimônio reduzem leituras;
- Functions e triggers usam chaves/eventos idempotentes;
- auditoria crítica é produzida apenas em ambiente confiável.

## Ambientes, observabilidade e entrega

Projetos separados: `finance-app-dev`, `finance-app-staging` e `finance-app-prod`, cada um com Authentication, Firestore, Storage, Functions, configurações, variáveis e secrets próprios. Secret Manager guarda segredos; Logging e Monitoring dão visibilidade a falhas e uso; Performance Monitoring acompanha o cliente; Analytics é opcional.

Pull requests executam typecheck, lint, testes, build e preview. A branch principal publica Rules, índices, Storage Rules, Functions e Hosting usando credenciais seguras e ambientes protegidos.

## Estratégia de testes

- Vitest para regras, schemas, hooks e unidades;
- Testing Library para comportamento de componentes;
- MSW ou mocks da camada de repositório;
- Playwright para fluxos essenciais;
- emuladores para Rules, repositories, Functions, transações, idempotência e permissões por papel.

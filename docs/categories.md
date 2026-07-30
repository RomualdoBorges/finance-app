# Categorias — Milestone 2

## Escopo entregue

Categorias pertencem exclusivamente ao grupo financeiro ativo e são persistidas
em `financialGroups/{groupId}/categories/{categoryId}`. Esta entrega contempla
catálogo padrão, categorias personalizadas e uma única camada de subcategorias.
Edição, arquivamento e exclusão permanecem fora do escopo.

Não existe `CategoryProvider`: os hooks combinam os contextos já existentes de
autenticação e grupo ativo com TanStack Query. O acesso ao Firebase permanece
isolado em `FirestoreCategoryRepository`; validações de negócio ficam em
`CategoryService`.

## Contrato

Cada documento contém:

- `groupId`;
- `name` e `normalizedName`;
- `type`: `income` ou `expense`;
- `origin`: `default` ou `custom`;
- `status`: somente `active` nesta etapa;
- `parentCategoryId`: `null` para raiz ou o ID de uma categoria raiz;
- `icon`: identificador de ícone ou `null`;
- `createdBy`;
- `createdAt` e `updatedAt` como `Firestore Timestamp`.

No domínio, timestamps são expostos como `Date`. Campos controlados não fazem
parte do input público de criação.

## Catálogo padrão e idempotência

O catálogo padrão é uma constante versionada no código, com IDs determinísticos
em inglês. `ensureDefaultCategories(groupId, userId)` roda somente depois que o
grupo ativo e seu membership estão disponíveis. O repository lê os IDs
existentes e cria em batch apenas os documentos ausentes.

Uma segunda execução não escreve documentos, não sobrescreve alterações futuras
e não modifica timestamps existentes. Evoluções futuras do catálogo podem
introduzir uma versão explícita, mas nenhuma migração/versionagem automática faz
parte desta etapa.

## Normalização, hierarquia e duplicidade

`normalizeCategoryName` aplica NFD, remove marcas diacríticas, converte para
minúsculas, elimina espaços externos e colapsa espaços internos. A duplicidade é
verificada entre categorias ativas com o mesmo grupo, tipo, pai e nome
normalizado.

Subcategorias:

- apontam para uma categoria raiz do mesmo grupo;
- herdam/restringem o tipo ao tipo do pai;
- não podem ser usadas como pai;
- limitam a árvore à profundidade 1.

O Firestore não oferece restrição de unicidade por consulta. A checagem atual de
duplicidade é adequada para o fluxo cliente desta etapa, mas duas criações
concorrentes podem passar pela leitura antes de qualquer escrita. Antes de
operações financeiras multiusuário, a unicidade forte deve migrar para uma
Function/transação com documento de reserva determinístico.

## Segurança

As Rules permitem leitura e criação somente para membro ativo do grupo.
Criações exigem conjunto exato de campos, identidade do grupo, `createdBy`
igual ao usuário autenticado, timestamps do servidor, enumerações válidas e pai
existente do mesmo tipo. `getAfter` permite validar pai e filha criados no mesmo
batch. Update e delete são bloqueados nesta etapa.

## Cache e atualização

As query keys são centralizadas por `groupId`. O primeiro carregamento garante o
catálogo e lista as categorias; o resultado fica estável no cache. Criações
personalizadas atualizam o cache do grupo ativo sem adicionar estado remoto ao
Zustand ou criar contexto global adicional.

# Política de Security Rules

As Rules de Firestore e Storage devem começar bloqueando tudo e liberar apenas operações explicitamente autorizadas. Elas complementam, mas não substituem, validações de domínio nas Cloud Functions.

## Autenticação e identidade

- qualquer dado privado exige `request.auth != null`;
- `request.auth.uid` é a identidade canônica;
- usuário só cria, lê ou atualiza `/users/{userId}` quando o ID é seu;
- senha, hash, tokens e credenciais bancárias nunca são aceitos no documento do usuário;
- exclusão de conta e outras operações privilegiadas passam por backend confiável.

## Participação em grupo

O acesso a `/financialGroups/{groupId}` e subcoleções exige documento ativo em `/financialGroups/{groupId}/members/{request.auth.uid}`. Authentication não concede acesso por si só.

Funções conceituais das Rules:

- `isAuthenticated()`;
- `isGroupMember(groupId)`;
- `hasRole(groupId, roles)`;
- `hasPermission(groupId, permission)`;
- `isOwner(entity)` e verificações de campos imutáveis.

Nenhum membro lê ou escreve dados de outro grupo. Criação inicial de grupo deve validar owner autenticado; exclusão de grupo é bloqueada ao cliente.

## Papéis

- `owner`: titular do grupo, inclusive decisões administrativas críticas;
- `admin`: administra participantes e recursos conforme permissões;
- `member`: opera dados financeiros dentro das permissões concedidas;
- `viewer`: leitura autorizada, sem mutações financeiras.

Somente `owner`/`admin` com `manageMembers` convidam ou removem participantes. Cliente não atribui papel ou permissões a si mesmo, não remove o último administrador e não altera `ownerId` por escrita comum. Permissões sensíveis são verificadas também nas Functions.

## Visibilidade

- `shared`: leitura por membros ativos que possuam permissão correspondente;
- `private`: leitura somente por `createdBy`, `ownerId` e administradores autorizados se — e somente se — essa política de produto for habilitada;
- consultas devem incluir restrições compatíveis com Rules; Rules não filtram resultados;
- escrita não pode forjar `createdBy`, `ownerId` ou visibilidade para obter acesso.

A possibilidade de administradores acessarem lançamentos privados é decisão pendente explícita; até sua definição, aplica-se o menor privilégio.

## Operações simples e críticas

O cliente pode fazer apenas leituras e escritas simples cujo contrato seja integralmente validável por documento. São bloqueadas ao cliente e expostas por Functions:

- transferências e alterações de seus pares;
- saldos `currentBalance` e `projectedBalance`;
- totais de fatura e limite disponível do cartão;
- campos calculados de orçamento, meta, dívida, resumo mensal e patrimônio;
- geração de parcelas e recorrências;
- importações confirmadas e recálculos;
- convites, papéis e permissões;
- auditoria confiável.

Uso do Admin SDK por Functions ignora Rules; portanto, cada Function deve repetir autenticação, participação, papel, validação de domínio, idempotência e auditoria.

## Campos protegidos

O cliente não altera diretamente:

- IDs de grupo, proprietário, criador e chaves de vínculo após criação;
- `createdAt` e demais timestamps de servidor imutáveis;
- saldos e agregados consolidados;
- `memberIds`, `ownerId`, papéis e permissões sem fluxo administrativo;
- `transferId`, `invoiceId`, `installmentPlanId` e controles de idempotência produzidos pelo backend;
- contadores/status de processamento de importação;
- `source`, `before` e `after` de auditoria.

Updates devem comparar `resource.data` e `request.resource.data` e permitir somente chaves mutáveis previstas.

## Validação de documentos

Para cada caminho, validar:

- conjunto de campos obrigatórios, permitidos e ausência de campos desconhecidos sensíveis;
- tipos (`string`, `int`, `bool`, `timestamp`, `list`, `map`);
- dinheiro como `int`, em regra positivo quando representa valor de operação;
- moeda, enumerações de tipo/status/papel/frequência/visibilidade;
- datas válidas e coerentes, como início antes do fim e vencimento compatível;
- IDs não vazios e referências pertencentes ao mesmo grupo quando verificável;
- comprimento de strings e tamanho máximo de listas como tags, anexos, condições e `memberIds`;
- propriedade do lançamento e permissão para editar lançamentos próprios ou de terceiros;
- transições de status permitidas;
- imutabilidade de campos protegidos;
- limites de dia, percentuais e contadores;
- `createdAt`/`updatedAt` baseados em tempo de servidor conforme o contrato.

## Auditoria

`auditLogs` pode ser lida somente por administradores autorizados. Nenhuma criação, atualização ou exclusão pelo frontend é permitida. Operações críticas geram auditoria em Cloud Functions.

## Cloud Storage

- acesso exige autenticação e participação ativa no grupo do caminho;
- avatar é limitado ao próprio usuário;
- tipo MIME e tamanho são permitidos explicitamente;
- nomes fornecidos pelo usuário não são usados diretamente no caminho;
- arquivos privados não têm URL pública permanente;
- importações e anexos só podem ser associados a entidades acessíveis;
- remoção periódica de órfãos ocorre em backend.

## Firebase App Check

App Check protege Firestore, Storage, Callable Functions e serviços compatíveis. Implantação:

1. monitorar requisições legítimas sem enforcement;
2. validar dev, staging, produção e mecanismos de debug local;
3. ativar enforcement por serviço e ambiente.

App Check não substitui Authentication, Rules, autorização nem validação no backend.

## Testes com Emulator Suite

Cobertura mínima:

- não autenticado não acessa dados;
- usuário lê/edita apenas o próprio perfil;
- membro ativo acessa somente seu grupo;
- usuário externo não acessa o grupo;
- `viewer` não escreve;
- `member` não altera papéis, permissões ou dados administrativos;
- `owner`/`admin` respeitam permissões e proteção do último administrador;
- lançamento privado não é lido por participante não autorizado;
- campos faltantes, extras, tipos inválidos, listas excessivas, datas incoerentes, status e valores inválidos são rejeitados;
- cliente não altera saldos, agregados, auditoria ou campos de backend;
- transferências e outras operações críticas não podem ser forjadas diretamente;
- Storage rejeita grupo alheio, MIME e tamanho proibidos;
- cenários positivos autorizados continuam funcionando.

Os testes usam Authentication, Firestore, Functions e Storage Emulators e não acessam dados de produção.

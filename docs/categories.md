# Categorias — Milestone 2

## Escopo entregue

Categorias pertencem exclusivamente ao grupo financeiro ativo e ficam em
`financialGroups/{groupId}/categories/{categoryId}`. O domínio oferece catálogo
padrão idempotente, categorias personalizadas, uma camada de subcategorias,
edição, arquivamento, restauração e exclusão quando segura.

O Firebase permanece isolado no repository. Hooks combinam autenticação, grupo
ativo e TanStack Query; validações e decisões de ciclo de vida ficam no service.

## Contrato e uso

Além dos campos de identidade, nome, tipo, origem, status, pai, ícone, autoria e
timestamps, cada documento novo contém `usageCount: 0`. O contador é a abstração
mínima de uso enquanto lançamentos ainda não existem. Ele é protegido contra
alteração pelo cliente e deverá ser mantido atomicamente pelo backend confiável
quando o domínio de lançamentos for implementado. Documentos legados sem o
campo são lidos como zero.

Uma categoria com `usageCount > 0` não pode ser excluída fisicamente. Ela pode
ser arquivada e continua disponível para histórico e relatórios. Categorias
arquivadas não são oferecidas como pai para novas subcategorias.

## Edição e hierarquia

Categorias personalizadas permitem editar nome, ícone, tipo e pai. A validação
impede pai ausente, arquivado, de outro tipo, subcategoria como pai, autorrelação,
profundidade maior que um e mudança de uma raiz com filhas ativas para uma
posição ou tipo incompatível.

Categorias padrão permitem editar somente nome e ícone. ID determinístico,
origem, tipo, pai, autor e data de criação são imutáveis. O provisionamento cria
somente IDs ausentes e nunca sobrescreve edições ou restaura automaticamente
categorias arquivadas, preservando a idempotência do catálogo.

Nomes são normalizados por remoção de diacríticos, caixa baixa e espaços
colapsados. A duplicidade considera categorias ativas do mesmo tipo e mesmo pai.
A checagem é feita no service; unicidade forte concorrente exigirá no futuro uma
reserva determinística em operação confiável.

## Arquivamento, restauração e exclusão

Arquivar uma raiz arquiva no mesmo batch todas as suas filhas ativas. Restaurar
uma raiz não restaura automaticamente as filhas; cada restauração revalida pai
ativo e duplicidade. Essa assimetria evita reativação implícita de opções.

Categorias padrão nunca são excluídas. Uma subcategoria personalizada com uso
zero e sem filhas pode ser excluída após confirmação. Categorias principais são
arquivadas, mesmo sem uso, porque as Rules não conseguem provar a ausência de
referências reversas durante um delete. Categoria usada também é apenas
arquivada. A interface diferencia arquivadas, explica a restrição de exclusão e
confirma ações destrutivas.

As Rules repetem as invariantes verificáveis por documento, protegem campos
imutáveis e o contador e usam `getAfter` para relações em batches. A ausência de
consulta reversa nas Rules impede provar que uma raiz não possui filhas durante
um delete isolado; por isso a exclusão física de raízes é bloqueada também no
service e na interface.

# Regras para agentes

Este documento define regras permanentes para qualquer agente que trabalhe neste repositório.

## Documentos obrigatórios

Antes de mudanças relevantes, leia:

- `SPECIFICATION.md`;
- `ARCHITECTURE.md`;
- `DESIGN.md`;
- `PLAN.md`;
- `docs/firestore-model.md`;
- `docs/business-rules.md`;
- `docs/security-rules.md`;
- `docs/user-flows.md`.

Em caso de conflito, confirme a intenção antes de alterar decisões de produto, arquitetura ou segurança.

## Stack e ferramentas

- Use exclusivamente `pnpm` para dependências e scripts.
- A stack é React, TypeScript, Vite e Firebase.
- Mantenha o TypeScript em modo `strict`.
- Não use `any` sem justificativa explícita e localizada.
- Use componentes funcionais e prefira `named exports`.
- Use React Router para navegação.
- Use TanStack Query para dados remotos e cache de servidor.
- Use Zustand apenas para estado compartilhado do cliente; não replique dados remotos nele.
- Use React Hook Form e Zod em formulários e validações.
- Use os emuladores Firebase durante desenvolvimento e testes.

## Arquitetura e domínio

- Separe componentes visuais de regras de negócio.
- Páginas e componentes não podem acessar Firebase diretamente.
- Centralize o acesso remoto em uma camada de repositories ou services.
- Operações financeiras compostas e críticas devem ser executadas de forma atômica no backend.
- Armazene valores monetários como inteiros em centavos.
- Persista datas como `Firestore Timestamp`.
- Não altere arquitetura ou dependências silenciosamente; documente e obtenha concordância para mudanças relevantes.
- Não faça refatorações fora do escopo da tarefa.

## Interface

- Escreva os textos da interface em português brasileiro.
- Preserve acessibilidade, responsividade, navegação por teclado e os estados de loading, erro, vazio e sucesso.

## Segurança

- Security Rules devem bloquear acesso por padrão.
- Nenhuma credencial, chave secreta ou secret pode estar no frontend ou ser versionado.
- Configurações públicas do Firebase devem vir de variáveis de ambiente validadas; segredos permanecem no ambiente seguro do backend.
- Teste Security Rules com os emuladores Firebase.

## Qualidade e entrega

Antes de concluir tarefas de implementação, execute e registre o resultado de:

1. `pnpm typecheck`;
2. `pnpm lint`;
3. testes aplicáveis;
4. `pnpm build`.

Se algum script ainda não existir, registre a limitação em vez de ignorá-la. Não marque trabalho como concluído sem a validação correspondente. Use Conventional Commits nas mensagens de commit.

# Integração contínua

O workflow `CI` executa em todo pull request, em pushes para a branch `main` e
quando iniciado manualmente pelo GitHub Actions. Ele usa Node.js 22 e
`pnpm@11.7.0`, instala as dependências com o lockfile congelado e valida, em
etapas separadas:

1. uso exclusivo do pnpm;
2. typecheck do frontend e das Cloud Functions;
3. lint e formatação;
4. testes unitários;
5. build do frontend e das Cloud Functions;
6. smoke E2E no Chromium com Playwright.

O CI não inicia a Emulator Suite, não acessa serviços Firebase reais e não
realiza deploy. O build e o preview recebem somente uma configuração Web
Firebase pública e fictícia, com a conexão para Auth, Firestore e Storage
apontada a hosts e portas locais. Nenhuma credencial ou configuração
administrativa é usada.

## Reprodução local

Use Node.js 22 e `pnpm@11.7.0`. Após configurar as variáveis públicas conforme
o `.env.example`, execute:

```sh
pnpm install --frozen-lockfile
pnpm verify:package-manager
pnpm typecheck
pnpm functions:typecheck
pnpm lint
pnpm format:check
pnpm test:run
pnpm build
pnpm functions:build
```

Para reproduzir o smoke E2E sem iniciar os emuladores:

```sh
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
```

O workflow deve estar verde antes do merge.

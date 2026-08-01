# Configuração pública e secrets do Firebase

Esta aplicação usa um único projeto Firebase real, `finance-app-dev-23ac7`.
Durante o desenvolvimento, o frontend deve usar a Emulator Suite; a aplicação
publicada usa os serviços reais desse projeto.

## Configuração Web pública

O frontend usa somente as variáveis `VITE_FIREBASE_*` presentes em
`.env.example`. Elas configuram o Firebase Web SDK e os endereços locais de
Auth, Firestore e Storage. `src/lib/firebase/env-schema.ts`:

- rejeita variável `VITE_*` desconhecida;
- exige e valida os identificadores da configuração Web;
- aceita `VITE_FIREBASE_USE_EMULATORS` somente como `true` ou `false`;
- converte portas para números entre 1 e 65535;
- exige hosts e portas dos três serviços quando os emuladores estão ativos;
- retorna apenas o conjunto tipado e validado de variáveis conhecidas.

A API key Web do Firebase não é uma credencial administrativa: ela identifica
o projeto para o SDK executado no navegador e, portanto, integra o bundle
publicado. A proteção dos dados depende de Firebase Security Rules,
autenticação e autorização; restrições de chave devem ser aplicadas quando
cabíveis, e App Check será adotado em milestone futura.

Mesmo públicas, essas variáveis não devem ser exibidas na interface nem
registradas em logs. Erros de configuração informam nomes e motivos, nunca os
valores recebidos. Não adicione tokens, senhas, chaves privadas, credenciais de
service account ou segredos administrativos a variáveis `VITE_*`: o Vite as
expõe ao código do navegador.

## Arquivos locais

`.env.example` contém apenas valores fictícios e pode ser versionado. Arquivos
reais `.env`, `.env.*`, `.env.local`, `.env.*.local` e `.secret.local` são
ignorados pelo Git. Antes de iniciar o frontend localmente:

```sh
cp .env.example .env.local
pnpm firebase:emulators
pnpm dev
```

Mantenha `VITE_FIREBASE_USE_EMULATORS=true` no desenvolvimento para evitar
acesso acidental aos serviços reais.

## Secrets futuros das Functions

Secrets pertencem exclusivamente ao runtime de Cloud Functions. Quando uma
integração futura realmente precisar de um secret:

1. declare-o no código de backend em `functions/src/config/`, usando o suporte
   a parâmetros secretos de `firebase-functions`;
2. vincule-o somente às Functions que precisarem dele;
3. leia-o somente durante a execução da Function;
4. configure o valor fora do repositório e mantenha valores locais de emulação
   em `functions/.secret.local`, que é ignorado;
5. nunca devolva nem registre o valor.

A pasta `functions/src/config/` reserva essa fronteira. Nenhum secret, nome de
secret ou integração com Secret Manager é criado neste milestone.

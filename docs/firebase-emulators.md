# Firebase Emulator Suite

O ambiente local usa a Firebase Emulator Suite para evitar acesso acidental ao projeto real durante desenvolvimento. Estão configurados Authentication (9099), Firestore (8080), Functions (5001), Storage (9199), Hosting (5000) e Emulator UI (4000), todos em `127.0.0.1`.

## Pré-requisitos e instalação

Instale Node.js 22, Java 21 ou mais recente e `pnpm`. Instale as dependências locais, incluindo a Firebase CLI versionada no projeto:

```sh
pnpm install
```

Copie `.env.example` para `.env.local` e mantenha `VITE_FIREBASE_USE_EMULATORS=true`. O arquivo `.env.local` contém configuração local, é ignorado pelo Git e nunca deve ser versionado.

As variáveis são validadas antes da inicialização do Firebase. Nomes `VITE_*`
desconhecidos, valores malformados e a ausência de host ou porta quando os
emuladores estão habilitados interrompem a aplicação com uma mensagem que
identifica a variável, sem registrar seu valor. Consulte
[`firebase-configuration.md`](./firebase-configuration.md) para a separação
entre configuração Web pública e secrets de backend.

## Uso diário

Terminal 1:

```sh
pnpm firebase:emulators
```

Terminal 2:

```sh
pnpm dev
```

A UI fica em <http://127.0.0.1:4000> e o Hosting local em <http://127.0.0.1:5000>. A função de diagnóstico responde em <http://127.0.0.1:5001/finance-app-dev-23ac7/southamerica-east1/health>.

## Dados locais

Os dados não são importados nem persistidos implicitamente. Para exportar o estado atual:

```sh
pnpm firebase:emulators:export
```

Para iniciar importando `.firebase/emulator-data` e exportar novamente ao encerrar:

```sh
pnpm firebase:emulators:import
```

Para remover somente essa exportação local:

```sh
pnpm firebase:emulators:clean
```

`pnpm firebase:emulators:exec` inicia os serviços, executa uma validação finita e os encerra.

## Emuladores e projeto real

Há um único projeto Firebase real, `finance-app-dev-23ac7`, usado pela aplicação publicada. Com `VITE_FIREBASE_USE_EMULATORS=true`, o frontend conecta Auth, Firestore e Storage aos endereços locais validados. Com `false`, conecta ao projeto real configurado pelas variáveis Web Firebase; por isso confirme a flag antes de desenvolver.

Os emuladores não reproduzem perfeitamente todos os comportamentos da nuvem. As regras iniciais de Firestore e Storage bloqueiam todo acesso; regras definitivas e seus testes serão implementados em milestone posterior.

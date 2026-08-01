# Configuração protegida das Functions

Este diretório é a fronteira para declarações futuras de configuração e
secrets exclusivos do backend.

Não importe módulos daqui no frontend e não use prefixo `VITE_` para secrets.
Quando houver uma necessidade concreta, declare o parâmetro secreto com a API
de `firebase-functions`, vincule-o apenas à Function consumidora e mantenha o
valor real fora do repositório. Para emulação local, use
`functions/.secret.local`, já ignorado pelo Git.

Nenhum secret é declarado ou criado nesta etapa.

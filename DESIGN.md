# Diretrizes de design

## Princípios

- Interface integralmente em português brasileiro.
- Layout limpo, moderno e orientado às tarefas financeiras.
- Hierarquia visual clara, sem excesso de informação simultânea.
- Consistência entre desktop e dispositivos móveis.
- Componentes acessíveis e previsíveis.

Não há identidade visual definitiva. Cores, tipografia, espaçamentos, raios, sombras, ícones de marca e medidas exatas são decisões pendentes.

## Navegação e layout

- Desktop: sidebar persistente com acesso às áreas principais.
- Celular: navegação inferior para destinos primários.
- Conteúdo principal com largura e espaçamento adequados à leitura.
- Cards de resumo para indicadores essenciais.
- Tabelas responsivas, convertidas em apresentação adequada a telas estreitas quando necessário.

## Estados da interface

Toda experiência assíncrona relevante deve prever:

- loading, preferencialmente preservando a estrutura visual;
- erro com explicação e ação de recuperação;
- estado vazio com orientação útil;
- sucesso com confirmação proporcional à ação.

Feedback não pode depender apenas de cor: deve combinar texto, ícone, forma ou posição. A aplicação deve evitar saltos de layout e ações duplicadas durante processamento.

## Acessibilidade

- Navegação completa por teclado.
- Foco visível e ordem de foco coerente.
- HTML semântico e nomes acessíveis.
- Contraste adequado nos temas claro e escuro.
- Rótulos e mensagens de validação associados aos campos.
- Suporte razoável a zoom e preferências de redução de movimento.
- Gráficos acompanhados por alternativas textuais ou tabulares.

## Localização

- Moeda formatada em BRL, por exemplo `R$ 1.234,56`.
- Datas exibidas no padrão brasileiro, conforme o contexto.
- Textos claros, diretos e consistentes.
- Valores negativos e positivos devem ter sinal e descrição, sem depender somente de vermelho ou verde.

## Decisões pendentes

- paleta e tokens de cores;
- famílias e escala tipográfica;
- grid, espaçamentos e breakpoints exatos;
- dimensões da sidebar e navegação inferior;
- linguagem de ilustrações e marca;
- estilos detalhados de gráficos e visualizações.

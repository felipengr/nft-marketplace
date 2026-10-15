# Arquitetura

Este documento descreve os contratos REST e de eventos, a política de sessão, o estado do carrinho, a estratégia de cache e a reconciliação entre REST e Socket.IO, além das limitações, decisões de UX e desvios do Figma. Setup, cenários e comandos estão no [README.md](README.md).

## Visão geral

```
UI (rotas e features)
   │  useQuery / useMutation / loaders do Router
TanStack Query  ◄──── RealtimeProvider (socket.io-client)
   │                         │
Axios (src/api)              │  WebSocket
   │  HTTP                   │
───┼─────────────────────────┼─────────── fronteira de rede
MSW handlers (src/mocks)  ◄── @mswjs/socket.io-binding
   │
Banco simulado (localStorage) + cenários + hub de tempo real
```

| Pasta | Responsabilidade |
| --- | --- |
| `src/api/contracts` | Schemas zod de requests, responses e eventos, compartilhados por app e mocks |
| `src/api` | Cliente Axios, funções de transporte por recurso, token de sessão e id do carrinho visitante |
| `src/queries` | Fábricas de query keys e `queryOptions` |
| `src/features` | Telas e hooks por domínio (catálogo, detalhe, carrinho, checkout, pedidos, conta, auth, favoritos) |
| `src/realtime` | Cliente Socket.IO, ledger de eventos e aplicação dos eventos no cache |
| `src/routes` | Rotas por arquivo do TanStack Router. Rotas privadas ficam em `_authenticated` |
| `src/mocks` | MSW, banco simulado, fixtures, cenários, hub de tempo real e painel de simulação. É o único lugar com dados fictícios |
| `src/lib` | Utilitários: dinheiro (`decimal.js`), query client, search params, JSON estável |

Na inicialização, o `main.tsx` sobe o MSW antes de importar o app. Isso garante que o `socket.io-client` encontre o `WebSocket` já interceptado. Com `VITE_ENABLE_MOCKS=false`, o mesmo código chama a API real.

## Contratos REST

Base `/api`. Todas as respostas são validadas com zod no cliente (`request(schema, config)`). Uma resposta fora do contrato vira o erro `INVALID_RESPONSE`, e o dado inválido nunca chega à UI.

Cabeçalhos enviados pelo interceptor do Axios:

- `Authorization: Bearer <token>`, quando há sessão;
- `X-Cart-Id: <uuid>`, o id do carrinho do visitante, sempre presente;
- `Idempotency-Key`, só em `POST /orders`.

### Erros

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "fields": { "email": "…" } } }
```

| HTTP | `code` | Uso |
| --- | --- | --- |
| 400 / 422 | `VALIDATION_ERROR` | Validação. `fields` é mapeado para os campos do formulário |
| 401 | `UNAUTHENTICATED` | Sem token ou token desconhecido |
| 401 | `SESSION_EXPIRED` | Token expirado |
| 403 | `FORBIDDEN` | Sem permissão (ex.: carteira recusou a conexão) |
| 404 | `NOT_FOUND` | Recurso inexistente |
| 409 | `CONFLICT` | Disponibilidade, cotação desatualizada, e-mail ou usuário já cadastrado, chave de idempotência reutilizada |
| 503 | `UNAVAILABLE` | Falha transitória |
| 500 | `INTERNAL_ERROR` | Erro do servidor |

No cliente também existem os códigos `NETWORK_ERROR`, `TIMEOUT` e `INVALID_RESPONSE`. São considerados **transitórios** (retry automático em queries): `NETWORK_ERROR`, `TIMEOUT`, `UNAVAILABLE` e `INTERNAL_ERROR`.

### Recursos

Valores em ETH são **strings decimais** (`"0.0125"`) em todo o caminho. Quantidades são inteiras.

| Recurso | Método e rota | Notas |
| --- | --- | --- |
| Sessão | `POST /auth/register` | 409 para e-mail ou usuário já cadastrado; devolve `{ token, user, expiresAt }` |
| | `POST /auth/login` | 401 para credenciais inválidas |
| | `GET /session` | `{ user, expiresAt }`; 401 `SESSION_EXPIRED` quando expira |
| | `POST /auth/logout` | Revoga o token |
| NFTs | `GET /nfts` | `q`, `tab`, `categories`, `networks`, `minPrice`, `maxPrice`, `sort`, `page`, `pageSize` (máx. 48); devolve `{ items, pagination, facets }` |
| | `GET /nfts/featured` | Destaques da home |
| | `GET /nfts/:nftId` | Detalhe com edições, `available` e `maxPerOrder`; 404 se não existe |
| | `GET /nfts/:nftId/related`, `GET /nfts/:nftId/reviews` | Relacionados e avaliações |
| Favoritos | `GET /favorites`, `PUT /favorites/:nftId`, `DELETE /favorites/:nftId` | Exigem sessão; `PUT` e `DELETE` são idempotentes |
| Carrinho | `GET /cart` | Do usuário ou do visitante (`X-Cart-Id`); tem `version` |
| | `POST /cart/items` | `{ nftId, editionId, quantity }`; 409 quando passa da disponibilidade |
| | `PATCH /cart/items/:lineId`, `DELETE /cart/items/:lineId` | Alterar quantidade e remover |
| | `PUT /cart/coupon`, `DELETE /cart/coupon` | Cupom inválido ou expirado gera erro de validação |
| | `POST /cart/merge` | `{ guestCartId }`: junta o carrinho do visitante ao do usuário no login |
| | `POST /cart/acknowledge` | O usuário aceita os novos preços e quantidades depois de uma mudança |
| Cotação | `GET /cart/quote` | `subtotal`, `discount`, `networkFee`, `total`, `cartVersion`, `issues[]` (`price-changed`, `insufficient-stock`, `sold-out`, `coupon-not-applicable`) e `expiresAt` |
| Pedidos | `POST /orders` | Cabeçalho `Idempotency-Key` obrigatório; corpo com comprador, carteira, `connectionId` e `expected: { cartVersion, total }` |
| | `GET /orders/:orderId` | Estado (`pending`, `confirmed`, `rejected`), `version`, snapshot dos itens e valores, transação simulada |
| Carteiras | `GET /wallets`, `PUT /wallets/:kind`, `DELETE /wallets/:kind` | `kind` = `primary` ou `secondary`; endereço EVM validado |
| | `POST /wallet-connections` | Simula a conexão (aprovação ou recusa) e devolve `connectionId` |
| Perfil | `GET /profile`, `PATCH /profile` | Dados do colecionador |
| | `PUT /profile/avatar`, `DELETE /profile/avatar` | Avatar redimensionado no cliente e enviado como data URL |
| | `POST /profile/password` | Exige a senha atual; a nova é guardada com hash e salt |

### Idempotência de pedidos

- O cliente gera a chave a partir de uma assinatura estável (`stableStringify({ userId, input })`) e a guarda em `sessionStorage`. Clique repetido, reenvio após timeout ou refresh reaproveitam a mesma chave.
- O mock guarda `{ key, userId, requestHash, orderId }`:
  - mesma chave com o mesmo corpo devolve o pedido existente;
  - mesma chave com outro corpo devolve **409** (`idempotency-conflict`).
- O botão de pagar fica desabilitado enquanto há envio em andamento, e o diálogo de revisão não fecha nesse intervalo.

### Revalidação no envio

`POST /orders` recalcula a cotação no servidor e compara com `expected.cartVersion` e `expected.total`. Qualquer diferença (preço, disponibilidade, cupom ou taxa) devolve **409** e nenhum pedido é criado. A UI recarrega a cotação, mostra os novos valores e exige nova confirmação.

## Eventos (Socket.IO)

Servidor: `VITE_REALTIME_URL`, transporte `websocket`. Todos os eventos usam o mesmo envelope:

```ts
{
  eventId: string
  resource: { type: 'nft' | 'order'; id: string }
  version: number
  occurredAt: string
  data: …
}
```

| Evento | Direção | `data` | Destinatários |
| --- | --- | --- | --- |
| `session.identify` | cliente → servidor | `{ token }` | — |
| `session.identified` | servidor → cliente | `{ userId \| null }` | A própria conexão |
| `nft.updated` | servidor → cliente | `{ price, previousPrice, available, editions[{ id, available, maxPerOrder }] }` | Todas as conexões |
| `order.updated` | servidor → cliente | `{ userId, status }` | Só as conexões identificadas com o dono do pedido |

Os eventos nascem das mesmas mutações do banco simulado que alimentam o REST: mudança de preço ou estoque no painel, confirmação de pedido, cenário `live-market`. REST e Socket.IO sempre concordam.

### Tolerância a duplicatas e eventos antigos

- `NftEventLedger` guarda os últimos 500 `eventId`; um evento repetido é descartado.
- Para cada NFT, o ledger e o cache guardam a maior `version` vista; um evento com versão menor ou igual é descartado e não regride o estado.
- Os patches no cache também comparam `version` item a item (catálogo, detalhe, destaques, relacionados e favoritos).
- `order.updated` é ignorado se `data.userId` não é o usuário atual ou se o pedido em cache já tem versão maior ou igual. Isso impede que eventos de uma sessão anterior alterem dados de outro usuário.

## Política de sessão

- **Token** opaco em `localStorage` (`kurio.session-token`). A sessão é recuperada no refresh via `GET /session`.
- **Validade** de 30 min por cenário (30 s em `short-session`). O cliente:
  - agenda uma revalidação para o instante de `expiresAt`;
  - consulta `GET /session` a cada 30 s enquanto há sessão;
  - revalida ao voltar o foco para a aba.
- **Expiração:** qualquer 401 numa requisição autenticada (exceto login e cadastro, onde 401 só significa credencial errada) dispara um evento global. O `SessionManager` então:
  1. limpa o token e o cache privado;
  2. avisa com um toast;
  3. numa rota privada, redireciona para `/login?redirect=<url atual>&reason=expired`; numa rota pública, apenas recarrega os dados.
- **Retomada:** depois do novo login, o usuário volta à URL de origem. O rascunho do checkout fica em `sessionStorage` (por usuário) e é restaurado.
- **Logout e troca de usuário:** cancelam e removem todas as queries `['private', …]`, trocam a identidade do socket (`session.identify` com o novo token) e mantêm só os dados públicos.
- **Proteção de rotas:** `_authenticated.beforeLoad` exige sessão para checkout, perfil, carteiras, favoritos e pedidos.

## Estado do carrinho

- **Fonte da verdade:** o servidor. O cliente nunca calcula totais; exibe a **cotação** (`GET /cart/quote`), e ela é a referência para o pedido. A aritmética local (ex.: atualização otimista de linha) usa `decimal.js`.
- **Visitante:** o carrinho é identificado por `X-Cart-Id`, um UUID em `localStorage`. No login ou cadastro, `POST /cart/merge` junta os itens respeitando a disponibilidade, e o id do visitante é rotacionado.
- **Versão:** cada alteração incrementa `cart.version`. O cliente só grava uma resposta no cache se ela não for mais antiga que a atual (`setCartIfNewer`). Isso descarta respostas fora de ordem.
- **Alteração remota:** quando um `nft.updated` atinge um item do carrinho, a cotação passa a ter `issues`. O carrinho mostra o aviso, o resumo é atualizado e o checkout fica bloqueado até o usuário aceitar os novos valores (`POST /cart/acknowledge`).
- **Após a compra:** só os itens e quantidades comprados saem do carrinho (feito no servidor, ao confirmar). Em recusa ou falha, o carrinho fica intacto.

## Pedidos e recibo

- `POST /orders` cria o pedido como `pending`, e a liquidação é agendada no mock. O cenário define o desfecho (`confirmed` ou `rejected`).
- O estado chega por `order.updated`. Como plano B, a página do pedido consulta a API a cada 4 s enquanto ele está pendente.
- O id do pedido pendente fica em `localStorage`. Depois de refresh ou reconexão, o usuário volta ao mesmo pedido sem criar outro.
- `confirmed` e `rejected` são terminais. O recibo só aparece para `confirmed`.
- O recibo é o **snapshot** gravado na criação do pedido: itens, preços, desconto, taxa, total e carteira. Mudanças posteriores no catálogo não o alteram. O hash da transação e o link do explorer são simulados.

## Cache, retries e sincronização

| Query | Key | `staleTime` | Observações |
| --- | --- | --- | --- |
| Catálogo | `['nfts','catalog', params]` | 30 s | `params` normalizados por zod; `keepPreviousData` na paginação |
| Destaques, relacionados, avaliações | `['nfts', …]` | 5 min | — |
| Detalhe | `['nfts','detail', id]` | 30 s | Pré-carregado no loader da rota |
| Sessão | `['session']` | 15 s | Revalidada a cada 30 s e ao focar a aba |
| Carrinho | `['private', userId, 'cart']` ou `['cart','guest', guestId]` | 15 s | — |
| Cotação | `[...cartKey, 'quote']` | 0 | Sempre revalidada |
| Carteiras, perfil, favoritos | `['private', userId, …]` | 60 s / padrão | — |
| Pedido | `['private', userId, 'orders', id]` | 0 | Consulta a cada 4 s enquanto está `pending` |

- **Isolamento:** todo dado privado fica sob `['private', userId]`. Trocar de usuário remove esse prefixo inteiro, e um usuário nunca vê o cache de outro.
- **Retries:** as queries repetem até 2 vezes só em erros transitórios, com backoff exponencial (500 ms, 1 s… até 4 s). Mutations não repetem sozinhas. A recuperação de pedido é feita pela idempotência, não por retry cego.
- **Respostas obsoletas:** toda `queryFn` repassa o `AbortSignal` ao Axios, então trocar de filtro cancela a requisição anterior. O carrinho também tem a guarda de versão.
- **Atualização otimista:**
  - favoritos, com rollback e toast em caso de erro;
  - quantidade no carrinho, com rollback ao snapshot anterior.
- **Invalidação após mutations:** carrinho e cotação após mudanças no carrinho; dados privados e NFTs após pedido terminal; carteiras após salvar ou remover; após editar o perfil ou o avatar, a resposta da API é gravada direto no cache do perfil e da sessão (o nome no cabeçalho atualiza na hora).
- **Estado na URL:** busca, filtros, ordenação e página ficam na URL (search params validados). Mudar um filtro volta para a página 1. Refresh e voltar/avançar restauram a tela.

## Reconciliação REST × Socket.IO

1. **Evento aplicado:** o `nft.updated` corrige diretamente os caches de catálogo, detalhe, destaques, relacionados e favoritos, respeitando a versão. Carrinhos que contêm o NFT e suas cotações são invalidados e buscados de novo na API. O catálogo é marcado como desatualizado (`refetchType: 'none'`) para revalidar na próxima visita.
2. **Corrida com fetch em andamento:** se um evento chega enquanto uma query afetada ainda está carregando, ela é invalidada de novo (`refetchInFlight`). Sem isso, uma resposta anterior ao evento poderia sobrescrever o patch.
3. **Reconexão:** no `connect` seguinte ao primeiro, o cliente se reidentifica e invalida NFTs ativos, carrinho e todo o cache privado. A API REST é a verdade depois de qualquer lacuna de eventos. Um toast informa que os dados foram atualizados.
4. **Ciclo de vida:** o socket é criado uma vez por app e encerrado com `off()` e `disconnect()` no unmount. A identidade acompanha a sessão.

## Mocks

- **Banco simulado** em `localStorage` (`kurio.mock-db`, com versão de schema; uma versão diferente reinicia o banco). Escritas são atômicas (`db.write`) e mantêm catálogo, carrinho, favoritos, perfil, carteiras e pedidos consistentes entre si.
- **Cenários** (`src/mocks/network/scenarios.ts`): latência (aleatória ou por URL, determinística por seed), regras de falha (`network-error`, `timeout` e HTTP 4xx/5xx, com `times` para falhas transitórias), TTL de sessão e comportamento do checkout. Efeitos de uso único (ex.: o primeiro envio dá timeout) são registrados para continuar determinísticos depois do refresh.
- **Hold/release:** os testes podem segurar respostas de uma rota para observar skeletons e liberá-las quando quiserem.
- **Reset:** `?mock-reset`, o painel ou `__kurioMocks.reset()` restauram fixtures, sessões, carrinhos, pedidos e o cenário `default`.

## Limitações conhecidas

- **Transporte Socket.IO simulado:** o `@mswjs/socket.io-binding` implementa o protocolo sobre um `WebSocket` interceptado no próprio navegador. Por isso:
  - só há transporte `websocket` (sem long-polling);
  - não há namespaces nem rooms; o envio por usuário é feito no hub (`sendToUser`), a partir do `session.identify`;
  - o binding não envia o ping do Engine.IO, então o hub manda o pacote `2` a cada 20 s para o cliente não encerrar a conexão por inatividade;
  - eventos existem só na aba que os gerou: duas abas compartilham o banco (`localStorage`), mas cada uma tem o próprio servidor simulado.
- **Liquidação de pedidos** usa timers da página. Se a aba fecha com pedido pendente, a liquidação é retomada na próxima carga (`resumePendingSettlements`).
- **Performance mobile:** o chunk de mocks (~480 KB, ~178 KB gzip) precisa carregar antes do app. Isso explica a Performance mobile abaixo de 90 no Lighthouse; a análise completa está em [lighthouse-reports/SUMMARY.md](lighthouse-reports/SUMMARY.md).
- **Fora do escopo** (blockchain, extensões de carteira, gateways reais): conexão, transação e explorer são simulados. Links de páginas editoriais, suporte e login social levam a um aviso de "em breve" e nunca simulam sucesso.

## Decisões de UX

- **Skeletons com shimmer** em catálogo, detalhe, resumo do carrinho, checkout e conta. Eles preservam as dimensões do conteúdo (o do detalhe ocupa a viewport para não deslocar o rodapé), e o shimmer para com `prefers-reduced-motion`.
- **Atualizações em segundo plano** não substituem o conteúdo por skeleton: o bloco fica levemente esmaecido com `aria-busy`.
- **Feedback acessível:**
  - toasts (`sonner`) para mutations e eventos;
  - regiões `aria-live` no resumo do carrinho e na revisão do pedido;
  - erros de formulário ligados aos campos por `aria-describedby`, com foco no primeiro campo inválido.
- **Login:** é um diálogo no desktop e uma página no mobile. O diálogo prende o foco e o devolve ao elemento que o abriu.
- **Favoritar sem sessão** avisa por que o login é necessário e abre o login no lugar, em vez de falhar em silêncio.
- **Mudança de preço com item no carrinho:** só avisa quando o NFT está no carrinho ou na tela atual, para não poluir a navegação.
- **Pagamento:** a revisão mostra itens e valores da cotação. A ordem é conectar a carteira (aprovação ou recusa simulada, com opção de desconectar) e depois pagar. O botão mostra o total exato que será cobrado.
- **Link de pular para o conteúdo** e foco visível em todos os elementos interativos.
- **Ajustes de acessibilidade em relação ao layout:**
  - contraste de textos secundários conferido com axe;
  - links inline sublinhados para não depender só de cor;
  - a galeria horizontal do mobile é focável para rolagem por teclado;
  - o selo "RARO" também é uma pista textual de raridade.

## Desvios do Figma

Todos são decisões conscientes, não descuidos:

- **Selo "RARO" nos cards do catálogo:**
  - o frame principal da home não tem o selo, mas os frames de login/cadastro (sobre a home) e a home mobile têm;
  - considerei a ausência um erro do frame principal e mantive o selo, que também dá uma pista de raridade que não depende só de cor.
- **"Contrato" e "Direitos autorais" no detalhe:** os textos estão trocados no Figma. A API devolve cada conteúdo sob o rótulo correto.
- **Galeria do detalhe:** repete a mesma arte nas miniaturas, porque o arquivo só traz 4 artes de NFT. As imagens foram exportadas do Figma e convertidas para WebP em 400, 800 e 1200 px, com `srcset`.
- **Coração de favorito em todos os cards:** o Figma mostra o ícone só em alguns cards. Favoritar é um requisito do desafio, então todo card tem a ação.
- **Código de indicação opcional no checkout:** o layout não indica obrigatoriedade, e exigir um código impediria a compra de quem não tem indicação.
- **Formulário de carteiras:** o frame de carteiras repete os campos do perfil. Eles ficaram só no perfil, para não haver dois lugares editando o mesmo dado.
- **Checkout mobile:** o formulário do comprador aparece abaixo da seleção de carteiras, seguindo a ordem de leitura de uma coluna.
- **Resumo no carrinho:** mantém o título do Figma, "Resumo da carteira", mesmo descrevendo o carrinho.

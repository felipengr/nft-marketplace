# Kurio — Marketplace de NFTs

Marketplace de NFTs com os fluxos de descoberta, compra e conta do colecionador, em versões desktop e mobile. API, autenticação, carteiras, pagamentos e eventos em tempo real são simulados no navegador com MSW, sem nenhum backend.

- **Demo:** https://nft-marketplace-ten-dun.vercel.app/
- **Arquitetura, contratos e decisões:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Auditoria Lighthouse:** [lighthouse-reports/SUMMARY.md](lighthouse-reports/SUMMARY.md)

## Stack

React 19, TypeScript, Vite 8, TanStack Router (rotas por arquivo), TanStack Query, Axios, Socket.IO (`socket.io-client`), Tailwind CSS v4, shadcn/ui, react-hook-form + zod, `decimal.js`, MSW v2 + `@mswjs/socket.io-binding`, Playwright e Lighthouse CI.

## Setup

Requisitos: Node 24 e npm.

```bash
npm ci
npm run dev
```

Abra http://localhost:5173. Nenhum serviço externo é necessário: a camada de mocks sobe junto com o app.

Para os testes E2E, instale uma vez o Chromium do Playwright:

```bash
npx playwright install chromium
```

## Variáveis de ambiente

Todas são opcionais. Os valores abaixo são os padrões e também estão em [.env.example](.env.example).

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` | Liga o MSW (REST e Socket.IO). Com `false`, o app chama a API real em `VITE_API_BASE_URL`. |
| `VITE_API_BASE_URL` | `/api` | Base das chamadas REST feitas pelo Axios. |
| `VITE_API_TIMEOUT_MS` | `10000` | Timeout do Axios. Depois dele a requisição falha com `TIMEOUT`. |
| `VITE_REALTIME_URL` | `wss://realtime.kurio.dev` | Endereço do servidor Socket.IO. Com mocks ativos, é interceptado pelo MSW. |

O build de demonstração (Vercel) usa os mocks por padrão, como pede o desafio.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com mocks |
| `npm run build` | Verificação de tipos e build de produção |
| `npm run preview` | Serve o build de produção |
| `npm run typecheck` | Só a verificação de tipos (`tsc -b`) |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Suíte Playwright completa (desktop 1440 px e mobile 390 px) |
| `npm run test:e2e:desktop` | Só o projeto desktop |
| `npm run test:e2e:update-snapshots` | Regenera as baselines de regressão visual (`@visual`) |
| `npm run test:e2e:report` | Abre o relatório HTML da última execução |
| `npm run audit` | Build e auditoria Lighthouse (3 execuções por página e perfil) |

## Credenciais fictícias

Todas usam a senha **`Kurio@2026`**.

| Usuário | E-mail |
| --- | --- |
| Ana Lima | `ana@kurio.dev` |
| Bruno Costa | `bruno@kurio.dev` |
| Felipe Nogueira | `felipe@kurio.dev` |
| Alison | `alison@kurio.dev` |

Também é possível criar contas pelo cadastro. As senhas são guardadas com hash SHA-256 e salt, nunca em texto puro.

Cupons de teste:

| Cupom | Efeito |
| --- | --- |
| `KURIO10` | 10% de desconto |
| `GENESIS` | 0.05 ETH de desconto em pedidos acima de 0.5 ETH |
| `BEMVINDO` | Expirado (para testar a mensagem de cupom expirado) |
| qualquer outro | Inválido |

## Cenários dos mocks

O estado dos mocks (catálogo, usuários, carrinhos, favoritos, carteiras, pedidos e sessões) fica no `localStorage` para sobreviver ao refresh.

### Seleção e reset

Há três formas de controlar os mocks:

1. **Painel de simulação.** Botão **Simulação**, no canto inferior direito. Ele troca o cenário, altera preço e estoque via Socket.IO, reenvia eventos duplicados ou antigos, derruba a conexão, expira sessões e restaura o estado inicial.
2. **Parâmetros de URL**, lidos ao carregar a página e removidos da barra de endereço em seguida:
   - `?mock-scenario=<nome>` ativa um cenário;
   - `?mock-reset` restaura o estado inicial e o cenário `default`;
   - `?mock-panel=off` ou `?mock-panel=on` esconde ou mostra o painel.
3. **Console do navegador:** `window.__kurioMocks`, com `useScenario`, `reset`, `fail`, `setPrice`, `sellOut`, `restock`, `dropRealtime`, `expireSessions` etc.

> O cenário escolhido **fica salvo** no `localStorage`. Ele continua ativo depois do refresh, até você escolher outro ou usar `?mock-reset`. Se algo parecer "quebrado" (catálogo vazio, tudo dando erro), provavelmente um cenário de falha ficou ativo: abra `/?mock-reset`.

### Cenários disponíveis

| Cenário | Comportamento |
| --- | --- |
| `default` | Latência realista (150–450 ms) e todas as operações com sucesso |
| `fast` | Sem latência (usado nos testes) |
| `slow` | Todas as respostas entre 1,8 s e 3 s |
| `out-of-order` | Latência variável por URL: respostas chegam fora de ordem |
| `offline` | Toda chamada à API falha na rede |
| `server-error` | Todas as leituras respondem 500 |
| `flaky` | As duas primeiras leituras respondem 503; os retries funcionam |
| `timeout` | A primeira leitura do catálogo nunca responde |
| `empty-catalog` | Catálogo vazio |
| `live-market` | O preço do Emerald Ape #042 sobe 0.05 ETH a cada 20 s via Socket.IO |
| `payment-rejected` | A carteira conecta, mas o pagamento é recusado |
| `wallet-rejected` | A carteira recusa a conexão |
| `order-timeout` | O pedido é criado, mas a resposta não chega; o reenvio recupera o mesmo pedido |
| `checkout-price-change` | Ao enviar o pedido, o preço sobe e o pedido exige nova confirmação |
| `checkout-sold-out` | Ao enviar o pedido, a edição esgota |
| `short-session` | A sessão expira 30 s depois do login |

## Como reproduzir os fluxos de falha

Antes de cada roteiro, abra `/?mock-reset` para partir de um estado conhecido.

| Fluxo | Passo a passo |
| --- | --- |
| Resultado vazio | `/?mock-scenario=empty-catalog`, ou uma busca sem resultado (ex.: `/?q=zzzz`) |
| Respostas fora de ordem | `/?mock-scenario=out-of-order` e troque filtros rapidamente: a lista sempre reflete o último filtro |
| Erro e retry | `/?mock-scenario=server-error` mostra o erro com "Tentar novamente"; `flaky` se recupera sozinho pelos retries |
| Sem conexão | `/?mock-scenario=offline` |
| NFT inexistente | `/nfts/nao-existe` |
| Cadastro em conflito | Cadastre-se com `ana@kurio.dev` |
| Cupom inválido ou expirado | No carrinho, aplique `XYZ` ou `BEMVINDO` |
| Sessão expirada na navegação | Entre, abra o painel e clique em **Expirar sessão**; ou use `short-session` e espere 30 s |
| Sessão expirada no checkout | Preencha o checkout e expire a sessão: depois do novo login você volta ao checkout com o formulário preservado |
| Preço muda com o NFT no carrinho | Ponha o Emerald Ape #042 no carrinho e use **Subir preço** no painel. O carrinho avisa, o resumo atualiza e o checkout bloqueia a cotação antiga |
| Preço muda no envio | `checkout-price-change`: o pagamento volta pedindo nova confirmação com o total novo |
| Edição esgota no envio | `checkout-sold-out` |
| Carteira recusa a conexão | `wallet-rejected` |
| Pagamento recusado | `payment-rejected`: o pedido termina como recusado e os itens continuam no carrinho |
| Timeout após criar o pedido | `order-timeout`: clique em "Tentar novamente" e o mesmo pedido é recuperado, sem compra duplicada |
| Queda do tempo real com pedido pendente | Pague e, enquanto o pedido está pendente, clique em **Derrubar conexão** (ou recarregue a página): o estado é recuperado ao reconectar |
| Eventos duplicados ou antigos | **Reenviar evento (duplicado)** e **Enviar evento antigo** no painel não alteram a interface |
| Falha de mutation de favorito | No console: `__kurioMocks.fail({ path: '/api/favorites/*', method: 'PUT', mode: 500, times: 1 })` e clique no coração. A UI desfaz a mudança otimista e avisa |

## Testes

A suíte Playwright fica em [tests/e2e](tests/e2e). Ela roda contra o build de produção (`vite preview` na porta 4173) em dois projetos, desktop (1440 px) e mobile (390 px). Cada teste começa com o estado dos mocks resetado e o cenário `fast`. Latência, retenção de respostas e disparo de eventos são controlados pelos mocks, e os eventos passam pelo `socket.io-client`.

| Arquivo | Cobertura |
| --- | --- |
| `01-catalog` | Busca, filtros combinados, ordenação, paginação, histórico e respostas fora de ordem |
| `02-nft-detail` | Acesso direto, NFT inexistente, edição indisponível e limite de quantidade |
| `03-auth` | Cadastro, login, expiração, logout e troca de usuário |
| `04-favorites` | Favoritos, falha de mutation e rollback |
| `05-cart` | Quantidades, remoção, cupom e persistência após refresh e login |
| `06-purchase` | Compra completa, do catálogo ao recibo |
| `07-payment-failures` | Pagamento recusado, cliques repetidos e timeout com recuperação idempotente |
| `08-account` | Perfil, avatar, senha e carteiras, com erros de validação |
| `09-realtime-checkout` | Mudança de preço e disponibilidade via Socket.IO durante o checkout |
| `10-realtime-resilience` | Eventos duplicados ou antigos, desconexão e retomada de pedido pendente |
| `11-accessibility` | axe-core (WCAG A/AA), teclado, foco em diálogos e erros de formulário |
| `12-loading-states` | Skeletons, movimento reduzido, erros e retries |
| `13-visual` | Regressão visual das telas principais (`@visual`) |

Falhas geram trace, vídeo e screenshot, e o relatório HTML fica em `playwright-report/`.

O CI ([.github/workflows/playwright.yml](.github/workflows/playwright.yml)) roda typecheck, lint, build e a suíte E2E sem as baselines visuais (`--grep-invert @visual`). As baselines são geradas no Windows, e a renderização de fontes difere no Linux. Localmente, `npm run test:e2e` roda tudo.

## Lighthouse

`npm run audit` gera o build, sobe `vite preview` na porta 4174 e audita o início e o detalhe do NFT nos perfis mobile e desktop, com 3 execuções cada, usando o Chromium do Playwright. A configuração está em [lighthouse/](lighthouse). O script gera os relatórios HTML/JSON e o [SUMMARY.md](lighthouse-reports/SUMMARY.md) com as medianas, LCP, CLS e TBT, o ambiente e a justificativa dos resultados abaixo da meta.

Para auditar pelo DevTools, use o build (`npm run build` e `npm run preview`) numa janela anônima. O servidor de desenvolvimento não é otimizado e dá notas muito menores.

## Decisões de design

Desvios intencionais do Figma, todos detalhados no [ARCHITECTURE.md](ARCHITECTURE.md#desvios-do-figma):

- **Selo "RARO" nos cards:** foi mantido de propósito. O frame principal da home não tem o selo, mas os frames de login/cadastro e a home mobile têm. Considerei a ausência um erro do frame principal e mantive o selo, que ainda dá à raridade uma pista que não depende só de cor.
- **"Contrato" e "Direitos autorais":** no Figma os dois textos estão trocados no detalhe do NFT. A API devolve cada texto sob o rótulo correto.
- **Galeria do detalhe:** repete a mesma arte nas 4 miniaturas, porque o arquivo do Figma só traz 4 artes.

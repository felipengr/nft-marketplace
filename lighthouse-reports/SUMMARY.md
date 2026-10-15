# Auditoria Lighthouse

Gerado em 2026-10-15T04:56:58.815Z por `npm run audit`. Valores são a **mediana de 3 execuções** por página e perfil.

## Mobile

| Página | Performance (meta ≥ 90) | Accessibility (meta ≥ 95) | Best Practices (meta ≥ 95) | SEO (meta ≥ 90) | LCP | CLS | TBT | FCP | Speed Index |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | 73 ⚠ | 100 | 100 | 100 | 4.65 s | 0.019 | 265 ms | 2.89 s | 3.07 s |
| Detalhe do NFT | 75 ⚠ | 99 | 100 | 100 | 4.45 s | 0.000 | 234 ms | 2.90 s | 3.08 s |

Condições: throttling simulado (RTT 150 ms, 1638.4 kbps, CPU 4×), tela 412×823 @1.75x, BenchmarkIndex mediano 2577.

## Desktop

| Página | Performance (meta ≥ 90) | Accessibility (meta ≥ 95) | Best Practices (meta ≥ 95) | SEO (meta ≥ 90) | LCP | CLS | TBT | FCP | Speed Index |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | 95 | 100 | 100 | 100 | 1.35 s | 0.000 | 3 ms | 0.83 s | 0.95 s |
| Detalhe do NFT | 95 | 100 | 100 | 100 | 1.35 s | 0.000 | 0 ms | 0.82 s | 0.88 s |

Condições: throttling simulado (RTT 40 ms, 10240 kbps, CPU 1×), tela 1350×940 @1x, BenchmarkIndex mediano 2642.

## Análise

- Corrigido a partir da primeira medição: meta description e `robots.txt` (SEO 83 → 100) e skeleton do detalhe ocupando a viewport, o que eliminou o deslocamento do rodapé (CLS 0,29 → 0).
- Performance mobile abaixo de 90: o backend falso roda no navegador. O chunk do mock (MSW, handlers, fixtures e binding Socket.IO: ~480 KB, ~178 KB gzip) e o registro do Service Worker precisam terminar antes de o app montar, porque o `socket.io-client` precisa encontrar o WebSocket já interceptado. Com CPU 4× e 1,6 Mbps simulados, isso sozinho adia o FCP para perto de 3 s e concentra a maior parte do TBT.
- Cada resposta do mock tem latência simulada de algumas centenas de ms no cenário padrão, de propósito, para exercitar skeletons e estados de carregamento. A imagem do LCP depende dessa resposta.
- Com uma API real, o MSW sai do bundle (`VITE_ENABLE_MOCKS=false`) e esse caminho crítico desaparece. Não simplificamos a aplicação só para subir a nota.
- Tentativa descartada: `modulepreload` de todo o grafo do app no HTML. Ele disputou banda com o bundle do MSW e piorou o mobile (Performance 67, FCP 3,8 s).

## Ambiente e versões

- Lighthouse 12.6.1 via @lhci/cli 0.15.1
- Navegador: Chromium do Playwright (Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.0.0 Safari/537.36)
- Node v24.19.0, Windows_NT 10.0.26300 (x64), 13th Gen Intel(R) Core(TM) i5-13450HX × 16, 32 GB RAM
- Build de produção (`npm run build`) servido por `vite preview`, com a camada de mocks ativa no cenário padrão (`default`)

## Relatórios

- mobile · Início: [-2026_10_15_04_53_18](mobile/-2026_10_15_04_53_18.html), [-2026_10_15_04_53_43](mobile/-2026_10_15_04_53_43.html), [-2026_10_15_04_53_59](mobile/-2026_10_15_04_53_59.html)
- mobile · Detalhe do NFT: [nfts_emerald_ape_042-2026_10_15_04_54_20](mobile/nfts_emerald_ape_042-2026_10_15_04_54_20.html), [nfts_emerald_ape_042-2026_10_15_04_54_36](mobile/nfts_emerald_ape_042-2026_10_15_04_54_36.html), [nfts_emerald_ape_042-2026_10_15_04_54_53](mobile/nfts_emerald_ape_042-2026_10_15_04_54_53.html)
- desktop · Início: [-2026_10_15_04_55_15](desktop/-2026_10_15_04_55_15.html), [-2026_10_15_04_55_34](desktop/-2026_10_15_04_55_34.html), [-2026_10_15_04_55_53](desktop/-2026_10_15_04_55_53.html)
- desktop · Detalhe do NFT: [nfts_emerald_ape_042-2026_10_15_04_56_09](desktop/nfts_emerald_ape_042-2026_10_15_04_56_09.html), [nfts_emerald_ape_042-2026_10_15_04_56_25](desktop/nfts_emerald_ape_042-2026_10_15_04_56_25.html), [nfts_emerald_ape_042-2026_10_15_04_56_42](desktop/nfts_emerald_ape_042-2026_10_15_04_56_42.html)

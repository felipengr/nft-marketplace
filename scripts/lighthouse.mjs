import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { chromium } from '@playwright/test'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUTPUT = path.join(ROOT, 'lighthouse-reports')
const LHCI = path.join(ROOT, 'node_modules', '@lhci', 'cli', 'src', 'cli.js')
const PROFILES = ['mobile', 'desktop']
const CATEGORIES = [
  ['performance', 'Performance', 90],
  ['accessibility', 'Accessibility', 95],
  ['best-practices', 'Best Practices', 95],
  ['seo', 'SEO', 90],
]
const METRICS = [
  ['largest-contentful-paint', 'LCP', (value) => `${(value / 1000).toFixed(2)} s`],
  ['cumulative-layout-shift', 'CLS', (value) => value.toFixed(3)],
  ['total-blocking-time', 'TBT', (value) => `${Math.round(value)} ms`],
  ['first-contentful-paint', 'FCP', (value) => `${(value / 1000).toFixed(2)} s`],
  ['speed-index', 'Speed Index', (value) => `${(value / 1000).toFixed(2)} s`],
]
const PAGES = { '/': 'Início', '/nfts/emerald-ape-042': 'Detalhe do NFT' }
const NOTES = [
  'Corrigido a partir da primeira medição: meta description e `robots.txt` (SEO 83 → 100) e skeleton do detalhe ocupando a viewport, o que eliminou o deslocamento do rodapé (CLS 0,29 → 0).',
  'Performance mobile abaixo de 90: o backend falso roda no navegador. O chunk do mock (MSW, handlers, fixtures e binding Socket.IO: ~480 KB, ~178 KB gzip) e o registro do Service Worker precisam terminar antes de o app montar, porque o `socket.io-client` precisa encontrar o WebSocket já interceptado. Com CPU 4× e 1,6 Mbps simulados, isso sozinho adia o FCP para perto de 3 s e concentra a maior parte do TBT.',
  'Cada resposta do mock tem latência simulada de algumas centenas de ms no cenário padrão, de propósito, para exercitar skeletons e estados de carregamento. A imagem do LCP depende dessa resposta.',
  'Com uma API real, o MSW sai do bundle (`VITE_ENABLE_MOCKS=false`) e esse caminho crítico desaparece. Não simplificamos a aplicação só para subir a nota.',
  'Tentativa descartada: `modulepreload` de todo o grafo do app no HTML. Ele disputou banda com o bundle do MSW e piorou o mobile (Performance 67, FCP 3,8 s).',
]

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function run(profile) {
  const config = path.join('lighthouse', `lighthouserc.${profile}.json`)
  for (const command of ['collect', 'upload']) {
    const result = spawnSync(process.execPath, [LHCI, command, `--config=${config}`], {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, CHROME_PATH: chromium.executablePath() },
    })
    if (result.status !== 0) throw new Error(`lhci ${command} failed for ${profile}`)
  }
  rmSync(path.join(ROOT, '.lighthouseci'), { recursive: true, force: true })
}

function summarize(profile) {
  const dir = path.join(OUTPUT, profile)
  const reports = readdirSync(dir).filter((name) => name.endsWith('.json') && name !== 'manifest.json')
  const byPage = new Map()
  for (const name of reports) {
    const lhr = JSON.parse(readFileSync(path.join(dir, name), 'utf8'))
    const pathname = new URL(lhr.finalDisplayedUrl ?? lhr.finalUrl).pathname
    const list = byPage.get(pathname) ?? []
    list.push({ lhr, name })
    byPage.set(pathname, list)
  }
  return [...byPage.entries()].map(([pathname, runs]) => ({
    pathname,
    runs: runs.length,
    files: runs.map((entry) => entry.name),
    categories: Object.fromEntries(CATEGORIES.map(([id]) => [id, median(runs.map(({ lhr }) => Math.round(lhr.categories[id].score * 100)))])),
    metrics: Object.fromEntries(METRICS.map(([id]) => [id, median(runs.map(({ lhr }) => lhr.audits[id].numericValue))])),
    lighthouseVersion: runs[0].lhr.lighthouseVersion,
    userAgent: runs[0].lhr.environment.hostUserAgent,
    benchmarkIndex: median(runs.map(({ lhr }) => lhr.environment.benchmarkIndex)),
    throttling: runs[0].lhr.configSettings.throttling,
    screenEmulation: runs[0].lhr.configSettings.screenEmulation,
  }))
}

function lhciVersion() {
  const result = spawnSync(process.execPath, [LHCI, '--version'], { cwd: ROOT, encoding: 'utf8' })
  return result.status === 0 ? result.stdout.trim() : 'indisponível'
}

function writeSummary(results) {
  const lines = []
  const lighthouseVersion = results.mobile[0]?.lighthouseVersion ?? 'desconhecida'
  lines.push('# Auditoria Lighthouse')
  lines.push('')
  lines.push(`Gerado em ${new Date().toISOString()} por \`npm run audit\`. Valores são a **mediana de 3 execuções** por página e perfil.`)
  lines.push('')
  for (const profile of PROFILES) {
    lines.push(`## ${profile === 'mobile' ? 'Mobile' : 'Desktop'}`)
    lines.push('')
    lines.push(`| Página | ${CATEGORIES.map(([, label, goal]) => `${label} (meta ≥ ${goal})`).join(' | ')} | ${METRICS.map(([, label]) => label).join(' | ')} |`)
    lines.push(`| --- | ${CATEGORIES.map(() => '---:').join(' | ')} | ${METRICS.map(() => '---:').join(' | ')} |`)
    for (const page of results[profile]) {
      const scores = CATEGORIES.map(([id, , goal]) => `${page.categories[id]}${page.categories[id] >= goal ? '' : ' ⚠'}`)
      const metrics = METRICS.map(([id, , format]) => format(page.metrics[id]))
      lines.push(`| ${PAGES[page.pathname] ?? page.pathname} | ${scores.join(' | ')} | ${metrics.join(' | ')} |`)
    }
    lines.push('')
    const sample = results[profile][0]
    if (sample) {
      lines.push(
        `Condições: throttling simulado (RTT ${sample.throttling.rttMs} ms, ${sample.throttling.throughputKbps} kbps, CPU ${sample.throttling.cpuSlowdownMultiplier}×), tela ${sample.screenEmulation.width}×${sample.screenEmulation.height} @${sample.screenEmulation.deviceScaleFactor}x, BenchmarkIndex mediano ${Math.round(sample.benchmarkIndex)}.`,
      )
      lines.push('')
    }
  }
  lines.push('## Análise')
  lines.push('')
  for (const note of NOTES) lines.push(`- ${note}`)
  lines.push('')
  lines.push('## Ambiente e versões')
  lines.push('')
  lines.push(`- Lighthouse ${lighthouseVersion} via @lhci/cli ${lhciVersion()}`)
  lines.push(`- Navegador: Chromium do Playwright (${results.mobile[0]?.userAgent ?? 'desconhecido'})`)
  lines.push(`- Node ${process.version}, ${os.type()} ${os.release()} (${os.arch()}), ${os.cpus()[0]?.model ?? 'CPU'} × ${os.cpus().length}, ${Math.round(os.totalmem() / 1024 ** 3)} GB RAM`)
  lines.push('- Build de produção (`npm run build`) servido por `vite preview`, com a camada de mocks ativa no cenário padrão (`default`)')
  lines.push('')
  lines.push('## Relatórios')
  lines.push('')
  for (const profile of PROFILES) {
    for (const page of results[profile]) {
      lines.push(`- ${profile} · ${PAGES[page.pathname] ?? page.pathname}: ${page.files.map((file) => `[${file.replace('.json', '')}](${profile}/${file.replace('.json', '.html')})`).join(', ')}`)
    }
  }
  lines.push('')
  writeFileSync(path.join(OUTPUT, 'SUMMARY.md'), lines.join('\n'))
  writeFileSync(path.join(OUTPUT, 'summary.json'), JSON.stringify(results, null, 2))
}

rmSync(OUTPUT, { recursive: true, force: true })
mkdirSync(OUTPUT, { recursive: true })
if (!existsSync(path.join(ROOT, 'dist', 'index.html'))) throw new Error('Run npm run build first')
for (const profile of PROFILES) run(profile)
const results = Object.fromEntries(PROFILES.map((profile) => [profile, summarize(profile)]))
writeSummary(results)
console.log(readFileSync(path.join(OUTPUT, 'SUMMARY.md'), 'utf8'))

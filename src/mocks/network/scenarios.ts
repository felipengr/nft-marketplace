export type FailureMode = 'network-error' | 'timeout' | 400 | 401 | 403 | 404 | 409 | 422 | 500 | 503

export type FailureRule = {
  path: string
  method?: string
  mode: FailureMode
  times?: number
}

export type LatencyStrategy = 'random' | 'by-url'

export type Scenario = {
  name: string
  description: string
  latency: { minMs: number; maxMs: number; strategy: LatencyStrategy }
  failures: FailureRule[]
  sessionTtlMs: number
  emptyCatalog: boolean
  liveMarket: boolean
}

const MINUTE = 60 * 1000

const BASE: Omit<Scenario, 'name' | 'description'> = {
  latency: { minMs: 150, maxMs: 450, strategy: 'random' },
  failures: [],
  sessionTtlMs: 30 * MINUTE,
  emptyCatalog: false,
  liveMarket: false,
}

function defineScenario(name: string, description: string, overrides: Partial<Omit<Scenario, 'name' | 'description'>> = {}): Scenario {
  return { ...BASE, ...overrides, name, description }
}

export const SCENARIOS = {
  default: defineScenario('default', 'Latência realista e todas as operações com sucesso.'),
  fast: defineScenario('fast', 'Sem latência, para testes automatizados.', {
    latency: { minMs: 0, maxMs: 0, strategy: 'random' },
  }),
  slow: defineScenario('slow', 'Rede lenta: todas as respostas entre 1,8 s e 3 s.', {
    latency: { minMs: 1800, maxMs: 3000, strategy: 'random' },
  }),
  'out-of-order': defineScenario('out-of-order', 'Latência variável por URL: respostas chegam fora de ordem.', {
    latency: { minMs: 100, maxMs: 2500, strategy: 'by-url' },
  }),
  offline: defineScenario('offline', 'Sem conexão: toda chamada à API falha na rede.', {
    failures: [{ path: '/api/*', mode: 'network-error' }],
  }),
  'server-error': defineScenario('server-error', 'Todas as leituras da API respondem 500.', {
    failures: [{ path: '/api/*', method: 'GET', mode: 500 }],
  }),
  flaky: defineScenario('flaky', 'As duas primeiras leituras da API respondem 503; as novas tentativas funcionam.', {
    failures: [{ path: '/api/*', method: 'GET', mode: 503, times: 2 }],
  }),
  timeout: defineScenario('timeout', 'A primeira leitura do catálogo nunca responde (timeout).', {
    failures: [{ path: '/api/nfts', method: 'GET', mode: 'timeout', times: 1 }],
  }),
  'empty-catalog': defineScenario('empty-catalog', 'Catálogo sem nenhum NFT.', { emptyCatalog: true }),
  'live-market': defineScenario('live-market', 'Mercado ao vivo: o preço do Emerald Ape #042 sobe 0.05 ETH a cada 20 segundos via Socket.IO.', {
    liveMarket: true,
  }),
  'short-session': defineScenario('short-session', 'Sessões expiram 30 segundos após o login.', {
    sessionTtlMs: 30 * 1000,
  }),
} satisfies Record<string, Scenario>

export type ScenarioName = keyof typeof SCENARIOS

export const DEFAULT_SCENARIO: ScenarioName = 'default'

export function isScenarioName(value: string): value is ScenarioName {
  return Object.hasOwn(SCENARIOS, value)
}

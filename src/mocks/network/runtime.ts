import { createRandom, hashString, type RandomSource } from '../fixtures/random'
import { DEFAULT_SCENARIO, SCENARIOS, isScenarioName, type FailureRule, type Scenario, type ScenarioName } from './scenarios'

const SCENARIO_KEY = 'kurio.mock-scenario'
const OVERRIDES_KEY = 'kurio.mock-overrides'
const LATENCY_SEED = 1440

type ActiveRule = FailureRule & { remaining: number | null }

type RuntimeState = {
  scenario: ScenarioName
  rules: ActiveRule[]
  random: RandomSource
}

function readScenario(): ScenarioName {
  try {
    const stored = window.localStorage.getItem(SCENARIO_KEY)
    return stored && isScenarioName(stored) ? stored : DEFAULT_SCENARIO
  } catch {
    return DEFAULT_SCENARIO
  }
}

function readOverrides(): ActiveRule[] {
  try {
    const raw = window.localStorage.getItem(OVERRIDES_KEY)
    return raw ? (JSON.parse(raw) as ActiveRule[]) : []
  } catch {
    return []
  }
}

function persist(state: RuntimeState, overrides: ActiveRule[]): void {
  try {
    window.localStorage.setItem(SCENARIO_KEY, state.scenario)
    window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides))
  } catch {
    return
  }
}

function toActive(rule: FailureRule): ActiveRule {
  return { ...rule, remaining: rule.times ?? null }
}

let overrides: ActiveRule[] = []

function buildState(name: ScenarioName): RuntimeState {
  return {
    scenario: name,
    rules: SCENARIOS[name].failures.map(toActive),
    random: createRandom(LATENCY_SEED),
  }
}

let state: RuntimeState | null = null

function current(): RuntimeState {
  if (!state) {
    state = buildState(readScenario())
    overrides = readOverrides()
  }
  return state
}

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${escaped}$`)
}

function matches(rule: ActiveRule, method: string, pathname: string): boolean {
  if (rule.remaining !== null && rule.remaining <= 0) return false
  if (rule.method && rule.method.toUpperCase() !== method.toUpperCase()) return false
  return globToRegExp(rule.path).test(pathname)
}

export const mockRuntime = {
  scenario(): Scenario {
    return SCENARIOS[current().scenario]
  },
  useScenario(name: ScenarioName): void {
    state = buildState(name)
    overrides = []
    persist(state, overrides)
  },
  addFailure(rule: FailureRule): void {
    current()
    overrides = [...overrides, toActive(rule)]
    persist(current(), overrides)
  },
  clearFailures(): void {
    overrides = []
    persist(current(), overrides)
  },
  takeFailure(method: string, pathname: string): ActiveRule | null {
    const runtime = current()
    const rule = [...overrides, ...runtime.rules].find((candidate) => matches(candidate, method, pathname))
    if (!rule) return null
    if (rule.remaining !== null) {
      rule.remaining -= 1
      if (overrides.includes(rule)) persist(runtime, overrides)
    }
    return rule
  },
  latencyFor(url: URL): number {
    const { latency } = this.scenario()
    const range = latency.maxMs - latency.minMs
    if (range <= 0) return latency.minMs
    if (latency.strategy === 'by-url') {
      return latency.minMs + (hashString(`${url.pathname}?${url.search}`) % (range + 1))
    }
    return latency.minMs + Math.round(current().random() * range)
  },
}

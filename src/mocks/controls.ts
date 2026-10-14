import { sessionToken } from '@/api/session-token'
import { expireAllSessions } from './auth/sessions'
import { db } from './db/database'
import { mockRuntime } from './network/runtime'
import { DEFAULT_SCENARIO, SCENARIOS, isScenarioName, type FailureRule } from './network/scenarios'

export type MockControls = {
  scenarios: () => Array<{ name: string; description: string }>
  scenario: () => string
  useScenario: (name: string) => void
  reset: () => void
  fail: (rule: FailureRule) => void
  clearFailures: () => void
  expireSessions: () => void
}

declare global {
  interface Window {
    __kurioMocks?: MockControls
  }
}

function activateScenario(name: string): void {
  if (!isScenarioName(name)) {
    throw new Error(`Unknown mock scenario "${name}". Available: ${Object.keys(SCENARIOS).join(', ')}`)
  }
  mockRuntime.useScenario(name)
}

export const mockControls: MockControls = {
  scenarios: () => Object.values(SCENARIOS).map(({ name, description }) => ({ name, description })),
  scenario: () => mockRuntime.scenario().name,
  useScenario: activateScenario,
  reset: () => {
    db.reset()
    sessionToken.clear()
    mockRuntime.useScenario(DEFAULT_SCENARIO)
  },
  fail: (rule) => mockRuntime.addFailure(rule),
  clearFailures: () => mockRuntime.clearFailures(),
  expireSessions: expireAllSessions,
}

export function applyUrlControls(): void {
  const url = new URL(window.location.href)
  const reset = url.searchParams.has('mock-reset')
  const scenario = url.searchParams.get('mock-scenario')
  if (reset) mockControls.reset()
  if (scenario) activateScenario(scenario)
  if (!reset && !scenario) return
  url.searchParams.delete('mock-reset')
  url.searchParams.delete('mock-scenario')
  window.history.replaceState(window.history.state, '', url)
}

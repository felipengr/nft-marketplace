import { sessionToken } from '@/api/session-token'
import { expireAllSessions } from './auth/sessions'
import { db } from './db/database'
import { mockRuntime } from './network/runtime'
import { DEFAULT_SCENARIO, SCENARIOS, isScenarioName, type FailureRule } from './network/scenarios'
import { realtimeHub } from './realtime/hub'
import { findNftRecord, restock, sellOut, updateNft, type NftPatch } from './realtime/market'

export type MockControls = {
  scenarios: () => Array<{ name: string; description: string }>
  scenario: () => string
  useScenario: (name: string) => void
  reset: () => void
  fail: (rule: FailureRule) => void
  clearFailures: () => void
  expireSessions: () => void
  updateNft: (nftId: string, patch: NftPatch) => { price: string; version: number }
  setPrice: (nftId: string, price: string) => { price: string; version: number }
  sellOut: (nftId: string, editionId?: string) => { version: number }
  restock: (nftId: string) => { version: number }
  replayLastEvent: () => string | null
  emitStaleEvent: (nftId: string, price: string) => string
  dropRealtime: () => number
  realtimeConnections: () => number
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

function summary(record: { price: string; version: number }) {
  return { price: record.price, version: record.version }
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
  updateNft: (nftId, patch) => summary(updateNft(nftId, patch)),
  setPrice: (nftId, price) => summary(updateNft(nftId, { price })),
  sellOut: (nftId, editionId) => ({ version: sellOut(nftId, editionId).version }),
  restock: (nftId) => ({ version: restock(nftId).version }),
  replayLastEvent: () => realtimeHub.replayLastNftEvent()?.eventId ?? null,
  emitStaleEvent: (nftId, price) => realtimeHub.emitStaleNftEvent(findNftRecord(nftId), price).eventId,
  dropRealtime: () => realtimeHub.disconnectAll(),
  realtimeConnections: () => realtimeHub.connectionCount(),
}

export function applyUrlControls(): void {
  const url = new URL(window.location.href)
  const reset = url.searchParams.has('mock-reset')
  const scenario = url.searchParams.get('mock-scenario')
  const panel = url.searchParams.get('mock-panel')
  if (panel === 'on' || panel === 'off') setPanelPreference(panel)
  if (reset) mockControls.reset()
  if (scenario) activateScenario(scenario)
  if (!reset && !scenario && !panel) return
  url.searchParams.delete('mock-reset')
  url.searchParams.delete('mock-scenario')
  url.searchParams.delete('mock-panel')
  window.history.replaceState(window.history.state, '', url)
}

const PANEL_KEY = 'kurio.mock-panel'

function setPanelPreference(value: 'on' | 'off'): void {
  try {
    window.localStorage.setItem(PANEL_KEY, value)
  } catch {
    return
  }
}

export function isPanelEnabled(): boolean {
  try {
    return window.localStorage.getItem(PANEL_KEY) !== 'off'
  } catch {
    return true
  }
}

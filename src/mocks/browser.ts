import { setupWorker } from 'msw/browser'
import { applyUrlControls, isPanelEnabled, mockControls } from './controls'
import { handlers } from './handlers'
import { startLiveMarket } from './realtime/live-market'

export const worker = setupWorker(...handlers)

export async function startMocks(): Promise<void> {
  applyUrlControls()
  await worker.start({
    quiet: true,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith('/api/')) print.warning()
    },
  })
  window.__kurioMocks = mockControls
  startLiveMarket()
  if (isPanelEnabled()) {
    const { mountSimulationPanel } = await import('./panel/mount-panel')
    mountSimulationPanel()
  }
}

import { setupWorker } from 'msw/browser'
import { applyUrlControls, mockControls } from './controls'
import { handlers } from './handlers'

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
}

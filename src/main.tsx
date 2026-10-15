import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

async function enableMocks(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'false') return
  const { startMocks } = await import('./mocks/browser')
  await startMocks()
}

async function bootstrap(): Promise<void> {
  await enableMocks()
  const { App } = await import('./app')
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()

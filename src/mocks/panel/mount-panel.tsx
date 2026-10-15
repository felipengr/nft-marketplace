import { createRoot } from 'react-dom/client'
import { SimulationPanel } from './simulation-panel'

export function mountSimulationPanel(): void {
  const host = document.createElement('div')
  host.id = 'kurio-simulation-panel'
  document.body.append(host)
  createRoot(host).render(<SimulationPanel />)
}

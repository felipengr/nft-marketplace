import { WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRealtimeStatus } from './realtime-context'

const GRACE_MS = 2000

export function RealtimeIndicator() {
  const status = useRealtimeStatus()
  const unhealthy = status === 'reconnecting' || status === 'offline'
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!unhealthy) {
      const reset = window.setTimeout(() => setVisible(false), 0)
      return () => window.clearTimeout(reset)
    }
    const timer = window.setTimeout(() => setVisible(true), GRACE_MS)
    return () => window.clearTimeout(timer)
  }, [unhealthy])

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-24 left-4 z-50 md:bottom-4">
      {visible && unhealthy ? (
        <p className="flex items-center gap-2 rounded-full border border-primary/60 bg-surface px-3 py-1.5 text-xs shadow-lg">
          <WifiOff className="size-3.5 text-primary" aria-hidden />
          {status === 'offline' ? 'Atualizações em tempo real indisponíveis.' : 'Reconectando atualizações em tempo real…'}
        </p>
      ) : null}
    </div>
  )
}

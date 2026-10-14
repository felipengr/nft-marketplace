import { toast } from 'sonner'

export function notifyComingSoon(feature: string): void {
  toast.info(`${feature} ainda não está disponível nesta versão da Kurio.`, { id: `coming-soon-${feature}` })
}

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { io, type Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { REALTIME_EVENTS, nftUpdatedEventSchema, orderUpdatedEventSchema, type NftUpdatedEvent } from '@/api/contracts/realtime'
import type { Order } from '@/api/contracts/order'
import type { NftDetail } from '@/api/contracts/nft'
import { sessionToken } from '@/api/session-token'
import { useSession } from '@/features/auth/use-session'
import { compareEth, formatEth } from '@/lib/money'
import { cartKeys } from '@/queries/cart-queries'
import { checkoutKeys } from '@/queries/checkout-queries'
import { nftKeys } from '@/queries/nft-queries'
import { privateKeys } from '@/queries/session-queries'
import { NftEventLedger, applyNftUpdate, type ApplyResult } from './apply-nft-update'
import { RealtimeContext, type RealtimeStatus } from './realtime-context'

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL ?? 'wss://realtime.kurio.dev'

function describeChange(event: NftUpdatedEvent, result: Extract<ApplyResult, { status: 'applied' }>, name: string): string | null {
  const previous = result.previous
  if (previous && compareEth(previous.price, event.data.price) !== 0) {
    return `O preço de ${name} mudou de ${formatEth(previous.price)} para ${formatEth(event.data.price)}.`
  }
  if (event.data.available === 0) return `${name} esgotou.`
  if (result.cartShortage) return `A disponibilidade de ${name} mudou e não cobre mais a quantidade no seu carrinho.`
  if (!result.inCart && previous && previous.available !== event.data.available) return `A disponibilidade de ${name} mudou.`
  return null
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { user } = useSession()
  const [status, setStatus] = useState<RealtimeStatus>('connecting')
  const socketRef = useRef<Socket | null>(null)
  const ledgerRef = useRef(new NftEventLedger())
  const userId = user?.id ?? null
  const userIdRef = useRef(userId)

  useEffect(() => {
    const socket = io(REALTIME_URL, {
      transports: ['websocket'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
    })
    socketRef.current = socket
    let hasConnected = false

    const identify = () => socket.emit(REALTIME_EVENTS.identify, { token: sessionToken.get() })

    const reconcile = () => {
      void queryClient.invalidateQueries({ queryKey: nftKeys.all, refetchType: 'active' })
      void queryClient.invalidateQueries({ queryKey: cartKeys.guestAll })
      void queryClient.invalidateQueries({ queryKey: privateKeys.all })
    }

    const onConnect = () => {
      setStatus('connected')
      identify()
      if (hasConnected) {
        reconcile()
        toast.success('Conexão em tempo real restabelecida. Dados atualizados.', { id: 'realtime-status' })
      }
      hasConnected = true
    }

    const onDisconnect = (reason: string) => {
      if (reason === 'io client disconnect') return
      setStatus('reconnecting')
    }

    const onNftUpdated = (payload: unknown) => {
      const parsed = nftUpdatedEventSchema.safeParse(payload)
      if (!parsed.success) return
      const event = parsed.data
      const result = applyNftUpdate(queryClient, ledgerRef.current, event)
      if (result.status !== 'applied') return
      const detail = queryClient.getQueryData<NftDetail>(nftKeys.detail(event.resource.id))
      const name = detail?.name ?? result.previous?.name ?? 'Um NFT'
      const viewing = router.state.location.pathname === `/nfts/${event.resource.id}`
      if (!result.inCart && !viewing) return
      const message = describeChange(event, result, name)
      if (!message) return
      const suffix = result.inCart ? ' Revise o carrinho antes de finalizar.' : ''
      toast.warning(`${message}${suffix}`, { id: `nft-updated-${event.resource.id}` })
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.io.on('reconnect_attempt', () => setStatus('reconnecting'))
    socket.io.on('reconnect_failed', () => setStatus('offline'))
    const onOrderUpdated = (payload: unknown) => {
      const parsed = orderUpdatedEventSchema.safeParse(payload)
      const currentUser = userIdRef.current
      if (!parsed.success || !currentUser || parsed.data.data.userId !== currentUser) return
      const event = parsed.data
      if (!ledgerRef.current.remember(event.eventId)) return
      const key = checkoutKeys.order(currentUser, event.resource.id)
      const cached = queryClient.getQueryData<Order>(key)
      if (cached && cached.version >= event.version) return
      void queryClient.invalidateQueries({ queryKey: key })
      if (router.state.location.pathname === '/checkout') {
        void router.navigate({ to: '/orders/$orderId', params: { orderId: event.resource.id } })
      }
      if (event.data.status === 'pending') return
      void queryClient.invalidateQueries({ queryKey: privateKeys.user(currentUser) })
      void queryClient.invalidateQueries({ queryKey: nftKeys.all })
      const toastId = `order-${event.resource.id}`
      if (event.data.status === 'confirmed') toast.success('Pagamento confirmado! Seus NFTs já estão na sua carteira.', { id: toastId })
      else toast.error('Pagamento recusado. Seus itens continuam no carrinho.', { id: toastId })
    }

    socket.on(REALTIME_EVENTS.nftUpdated, onNftUpdated)
    socket.on(REALTIME_EVENTS.orderUpdated, onOrderUpdated)

    return () => {
      socket.off()
      socket.io.off()
      socket.disconnect()
      socketRef.current = null
    }
  }, [queryClient, router])

  useEffect(() => {
    userIdRef.current = userId
    const socket = socketRef.current
    if (socket?.connected) socket.emit(REALTIME_EVENTS.identify, { token: sessionToken.get() })
  }, [userId])

  return <RealtimeContext.Provider value={status}>{children}</RealtimeContext.Provider>
}

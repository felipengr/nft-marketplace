import { addEth } from '@/lib/money'
import { mockRuntime } from '../network/runtime'
import { findNftRecord, updateNft } from './market'

const LIVE_NFT_ID = 'emerald-ape-042'
const TICK_MS = 20_000
const STEP = '0.05'

let timer: number | null = null

export function startLiveMarket(): void {
  if (timer !== null) return
  timer = window.setInterval(() => {
    if (!mockRuntime.scenario().liveMarket) return
    const record = findNftRecord(LIVE_NFT_ID)
    updateNft(LIVE_NFT_ID, { price: addEth(record.price, STEP) })
  }, TICK_MS)
}

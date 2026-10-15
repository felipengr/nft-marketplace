import { compareEth, isEthAmount, normalizeEth } from '@/lib/money'
import { db } from '../db/database'
import type { NftRecord } from '../fixtures/nfts'
import { realtimeHub } from './hub'

const MAX_PER_ORDER = 10

export type NftPatch = {
  price?: string
  editions?: Array<{ id: string; available: number }>
}

function applyPatch(record: NftRecord, patch: NftPatch): void {
  if (patch.price !== undefined) {
    if (!isEthAmount(patch.price)) throw new Error(`Invalid ETH amount "${patch.price}"`)
    const next = normalizeEth(patch.price)
    if (compareEth(next, record.price) !== 0) {
      record.previousPrice = compareEth(next, record.price) < 0 ? record.price : null
      record.price = next
    }
  }
  for (const change of patch.editions ?? []) {
    const edition = record.editions.find((item) => item.id === change.id)
    if (!edition) throw new Error(`Unknown edition "${change.id}" for ${record.id}`)
    const capped = edition.supply === null ? change.available : Math.min(change.available, edition.supply)
    edition.available = Math.max(0, Math.floor(capped))
    edition.maxPerOrder = Math.min(edition.available, MAX_PER_ORDER)
  }
}

export function updateNft(nftId: string, patch: NftPatch): NftRecord {
  const record = db.write((state) => {
    const target = state.nfts.find((item) => item.id === nftId)
    if (!target) throw new Error(`Unknown NFT "${nftId}"`)
    applyPatch(target, patch)
    target.version += 1
    return structuredClone(target)
  })
  realtimeHub.emitNftUpdated(record)
  return record
}

export function sellOut(nftId: string, editionId?: string): NftRecord {
  const record = db.read().nfts.find((item) => item.id === nftId)
  if (!record) throw new Error(`Unknown NFT "${nftId}"`)
  const editions = record.editions
    .filter((edition) => !editionId || edition.id === editionId)
    .map((edition) => ({ id: edition.id, available: 0 }))
  return updateNft(nftId, { editions })
}

export function findNftRecord(nftId: string): NftRecord {
  const record = db.read().nfts.find((item) => item.id === nftId)
  if (!record) throw new Error(`Unknown NFT "${nftId}"`)
  return record
}

export function restock(nftId: string): NftRecord {
  const record = findNftRecord(nftId)
  const editions = record.editions.map((edition) => ({ id: edition.id, available: edition.supply ?? 999 }))
  return updateNft(nftId, { editions })
}

import type { Category, Edition, Network } from '@/api/contracts/nft'
import { multiplyEth, toEth } from '@/lib/money'
import { slugify } from '@/lib/text'
import { ARTWORKS, ARTWORK_ORDER, type ArtworkId } from './artworks'
import { CATEGORY_ORDER, NETWORK_ORDER } from './labels'
import { createRandom, pick, randomInt, type RandomSource } from './random'

export type NftRecord = {
  id: string
  name: string
  tokenId: string
  artwork: ArtworkId
  price: string
  previousPrice: string | null
  category: Category
  network: Network
  isRare: boolean
  isNewRelease: boolean
  trendingScore: number
  listedAt: string
  version: number
  collection: { id: string; name: string }
  attributes: string[]
  editions: Edition[]
  rating: { average: string; count: number }
  creator: { name: string; royaltyPercent: string }
  contract: { address: string; standard: string }
}

type CuratedNft = {
  name: string
  number: number
  artwork: ArtworkId
  price: string
  previousPrice?: string
  category: Category
  network: Network
  isRare?: boolean
  attributes?: string[]
  rating: { average: string; count: number }
  editions?: Array<Pick<Edition, 'id' | 'available'>>
}

const CREATORS = ['Nova Sato', 'Lia Moreau', 'Kenji Arai', 'Marta Okafor', 'Davi Rocha']

const LISTING_ANCHOR = Date.UTC(2026, 9, 10, 12, 0, 0)

const HOUR = 60 * 60 * 1000

const MAX_PER_ORDER = 10

const CURATED: CuratedNft[] = [
  {
    name: 'Emerald Ape',
    number: 42,
    artwork: 'glasses-ape',
    price: '1.19',
    category: 'digital-art',
    network: 'ethereum',
    attributes: ['Óculos', 'Esmeralda', 'Raro'],
    rating: { average: '4.8', count: 19 },
    editions: [
      { id: '1-of-1', available: 0 },
      { id: '1-of-10', available: 3 },
      { id: '1-of-50', available: 24 },
      { id: 'open', available: 999 },
    ],
  },
  { name: 'Sage Nomad', number: 9, artwork: 'bucket-hat-ape', price: '1.69', category: 'photography', network: 'polygon', rating: { average: '4.6', count: 12 } },
  { name: 'Neon Vessel', number: 552, artwork: 'blazer-ape', price: '1.99', previousPrice: '2.29', category: 'collectibles', network: 'ethereum', isRare: true, rating: { average: '4.9', count: 31 } },
  { name: 'Cosmic Bloom', number: 118, artwork: 'bucket-hat-ape', price: '1.29', category: 'generative', network: 'solana', rating: { average: '4.4', count: 8 } },
  { name: 'Violet Nomad', number: 314, artwork: 'bucket-hat-ape', price: '1.39', category: 'digital-art', network: 'ethereum', rating: { average: '4.7', count: 22 } },
  { name: 'Ivory Baron', number: 88, artwork: 'blazer-ape', price: '1.79', category: '3d-art', network: 'polygon', rating: { average: '4.5', count: 15 } },
  { name: 'Golden Beat', number: 207, artwork: 'headphones-ape', price: '0.99', category: 'music', network: 'ethereum', rating: { average: '4.3', count: 9 } },
  { name: 'Golden Frequency', number: 71, artwork: 'headphones-ape', price: '0.59', category: 'music', network: 'solana', rating: { average: '4.2', count: 6 } },
  { name: 'Golden Signal', number: 160, artwork: 'headphones-ape', price: '0.39', category: 'music', network: 'polygon', rating: { average: '4.6', count: 11 } },
]

const GENERATED_COUNT = 63

const EDITION_TEMPLATES: Array<Pick<Edition, 'id' | 'label' | 'supply'>> = [
  { id: '1-of-1', label: '1/1', supply: 1 },
  { id: '1-of-10', label: '1/10', supply: 10 },
  { id: '1-of-50', label: '1/50', supply: 50 },
  { id: 'open', label: 'ABERTA', supply: null },
]

function formatNumber(number: number): string {
  return String(number).padStart(3, '0')
}

function buildEdition(template: Pick<Edition, 'id' | 'label' | 'supply'>, available: number): Edition {
  return { ...template, available, maxPerOrder: Math.min(available, MAX_PER_ORDER) }
}

function randomEditions(random: RandomSource, soldOut: boolean): Edition[] {
  if (soldOut) {
    return EDITION_TEMPLATES.filter((template) => template.supply !== null).map((template) => buildEdition(template, 0))
  }
  return EDITION_TEMPLATES.map((template) => {
    if (template.supply === null) return buildEdition(template, 999)
    if (template.supply === 1) return buildEdition(template, random() < 0.6 ? 0 : 1)
    return buildEdition(template, randomInt(random, 0, template.supply))
  })
}

function curatedEditions(curated: CuratedNft, random: RandomSource): Edition[] {
  if (!curated.editions) return randomEditions(random, false)
  return curated.editions.map((edition) => {
    const template = EDITION_TEMPLATES.find((item) => item.id === edition.id)
    if (!template) throw new Error(`Unknown edition ${edition.id}`)
    return buildEdition(template, edition.available)
  })
}

function randomPrice(random: RandomSource): string {
  const cents = 2 + Math.floor(1228 * random() ** 2.4)
  return toEth(cents).dividedBy(100).toFixed(2)
}

function randomAddress(random: RandomSource, network: Network): string {
  if (network === 'solana') {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    return Array.from({ length: 44 }, () => pick(random, alphabet.split(''))).join('')
  }
  const hex = '0123456789ABCDEF'
  return `0x${Array.from({ length: 40 }, () => pick(random, hex.split(''))).join('')}`
}

function randomRating(random: RandomSource): { average: string; count: number } {
  const tenths = randomInt(random, 36, 50)
  return { average: toEth(tenths).dividedBy(10).toFixed(1), count: randomInt(random, 0, 60) }
}

function buildRecord(input: {
  index: number
  name: string
  number: number
  artwork: ArtworkId
  price: string
  previousPrice: string | null
  category: Category
  network: Network
  isRare: boolean
  attributes?: string[]
  rating: { average: string; count: number }
  editions: Edition[]
  random: RandomSource
}): NftRecord {
  const artwork = ARTWORKS[input.artwork]
  const fullName = `${input.name} #${formatNumber(input.number)}`
  const attributes = input.attributes ?? (input.isRare ? [...artwork.attributes.slice(0, 2), 'Raro'] : artwork.attributes)
  return {
    id: `${slugify(input.name)}-${formatNumber(input.number)}`,
    name: fullName,
    tokenId: `#${String(input.number).padStart(4, '0')}`,
    artwork: input.artwork,
    price: input.price,
    previousPrice: input.previousPrice,
    category: input.category,
    network: input.network,
    isRare: input.isRare,
    isNewRelease: input.index < 24,
    trendingScore: randomInt(input.random, 0, 100),
    listedAt: new Date(LISTING_ANCHOR - input.index * 7 * HOUR).toISOString(),
    version: 1,
    collection: artwork.collection,
    attributes,
    editions: input.editions,
    rating: input.rating,
    creator: { name: input.index === 0 ? 'Nova Sato' : pick(input.random, CREATORS), royaltyPercent: '5' },
    contract: {
      address: randomAddress(input.random, input.network),
      standard: input.network === 'solana' ? 'Metaplex' : 'ERC-721',
    },
  }
}

export function createNftFixtures(): NftRecord[] {
  const random = createRandom(20261014)
  const records: NftRecord[] = CURATED.map((curated, index) =>
    buildRecord({
      index,
      name: curated.name,
      number: curated.number,
      artwork: curated.artwork,
      price: curated.price,
      previousPrice: curated.previousPrice ?? null,
      category: curated.category,
      network: curated.network,
      isRare: curated.isRare ?? false,
      attributes: curated.attributes,
      rating: curated.rating,
      editions: curatedEditions(curated, random),
      random,
    }),
  )
  const usedIds = new Set(records.map((record) => record.id))

  for (let offset = 0; offset < GENERATED_COUNT; offset += 1) {
    const index = CURATED.length + offset
    const artworkId = ARTWORK_ORDER[offset % ARTWORK_ORDER.length]
    const artwork = ARTWORKS[artworkId]
    const name = artwork.names[Math.floor(offset / ARTWORK_ORDER.length) % artwork.names.length]
    let number = randomInt(random, 1, 999)
    while (usedIds.has(`${slugify(name)}-${formatNumber(number)}`)) number = randomInt(random, 1, 999)

    const price = offset === 0 ? '0.02' : offset === 1 ? '12.30' : randomPrice(random)
    const hasDiscount = random() < 0.15
    const previousPrice = hasDiscount ? toEth(multiplyEth(price, randomInt(random, 110, 130))).dividedBy(100).toFixed(2) : null
    const soldOut = offset % 21 === 5

    const record = buildRecord({
      index,
      name,
      number,
      artwork: artworkId,
      price,
      previousPrice,
      category: pick(random, CATEGORY_ORDER),
      network: pick(random, NETWORK_ORDER),
      isRare: random() < 0.2,
      rating: randomRating(random),
      editions: randomEditions(random, soldOut),
      random,
    })
    usedIds.add(record.id)
    records.push(record)
  }

  return records
}

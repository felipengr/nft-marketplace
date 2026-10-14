import type { Review } from '@/api/contracts/nft'
import { toEth } from '@/lib/money'
import type { NftRecord } from './nfts'
import { createRandom, hashString, pick } from './random'

const AUTHORS = [
  'colecionador.br',
  'pixelnomade',
  'luna.eth',
  'arte_onchain',
  'mintmaster',
  'rafa.nft',
  'galeria.lab',
  'satoshi_curioso',
  'bia.cripto',
  'kurio.fan',
  'vitrine3d',
  'dao.do.bairro',
]

const COMMENTS: Record<number, string[]> = {
  5: [
    'Arte impecável, os detalhes em alta resolução são impressionantes.',
    'Procedência clara e entrega instantânea na carteira. Recomendo.',
    'Uma das peças mais bonitas da minha coleção.',
    'O acesso desbloqueável para colecionadores vale muito a pena.',
  ],
  4: [
    'Obra muito bem acabada, só senti falta de mais atributos raros.',
    'Ótima peça, a comunidade da coleção é bem ativa.',
    'Gostei bastante, os metadados estão completos e verificados.',
  ],
  3: ['Bonito, mas esperava mais variação de cores.', 'Boa peça, embora o preço esteja um pouco alto.'],
  2: ['A arte é boa, mas a edição aberta diminuiu a exclusividade.'],
  1: ['Não era o que eu esperava para esta coleção.'],
}

const REVIEW_ANCHOR = Date.UTC(2026, 9, 12, 18, 0, 0)

const DAY = 24 * 60 * 60 * 1000

function distributeRatings(average: string, count: number): number[] {
  const total = toEth(average).times(count).toDecimalPlaces(0).toNumber()
  const base = Math.min(5, Math.max(1, Math.floor(total / count)))
  const extras = Math.max(0, Math.min(count, total - base * count))
  return Array.from({ length: count }, (_, index) => Math.min(5, index < extras ? base + 1 : base))
}

export function buildReviews(record: NftRecord): Review[] {
  const { count, average } = record.rating
  if (count === 0) return []
  const random = createRandom(hashString(record.id))
  return distributeRatings(average, count)
    .map((rating, index) => ({ rating, order: random(), index }))
    .sort((a, b) => a.order - b.order)
    .map(({ rating, index }, position) => ({
      id: `${record.id}-review-${index + 1}`,
      author: pick(random, AUTHORS),
      rating,
      comment: pick(random, COMMENTS[rating]),
      createdAt: new Date(REVIEW_ANCHOR - position * DAY - Math.floor(random() * DAY)).toISOString(),
    }))
}

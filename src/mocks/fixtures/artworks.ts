import type { Image } from '@/api/contracts/common'

export type ArtworkId = 'glasses-ape' | 'bucket-hat-ape' | 'blazer-ape' | 'headphones-ape'

export type Artwork = {
  id: ArtworkId
  description: string
  collection: { id: string; name: string }
  attributes: string[]
  names: string[]
}

export const ARTWORKS: Record<ArtworkId, Artwork> = {
  'glasses-ape': {
    id: 'glasses-ape',
    description: 'macaco de pelagem castanha com óculos redondos de lentes verdes, jaqueta college verde e colar com pingente de esmeralda',
    collection: { id: 'kurio-apes', name: 'Kurio Apes' },
    attributes: ['Óculos', 'Esmeralda', 'Jaqueta college'],
    names: ['Emerald Ape', 'Jade Ape', 'Onyx Ape', 'Copper Ape', 'Velvet Ape', 'Crimson Ape'],
  },
  'bucket-hat-ape': {
    id: 'bucket-hat-ape',
    description: 'gorila de pelagem cinza com chapéu bucket verde-oliva e moletom lilás com capuz',
    collection: { id: 'kurio-nomads', name: 'Kurio Nomads' },
    attributes: ['Chapéu bucket', 'Moletom', 'Lavanda'],
    names: ['Sage Nomad', 'Violet Nomad', 'Cosmic Bloom', 'Lunar Nomad', 'Mist Wanderer', 'Moss Bloom'],
  },
  'blazer-ape': {
    id: 'blazer-ape',
    description: 'macaco de pelagem preta com blazer bege, blusa de gola alta verde e brinco dourado',
    collection: { id: 'kurio-barons', name: 'Kurio Barons' },
    attributes: ['Blazer', 'Gola alta', 'Brinco dourado'],
    names: ['Neon Vessel', 'Ivory Baron', 'Obsidian Baron', 'Marble Vessel', 'Velour Baron', 'Ember Vessel'],
  },
  'headphones-ape': {
    id: 'headphones-ape',
    description: 'macaco de pelagem dourada com fones de ouvido verdes e jaqueta bomber creme',
    collection: { id: 'kurio-frequencies', name: 'Kurio Frequencies' },
    attributes: ['Fones de ouvido', 'Bomber', 'Dourado'],
    names: ['Golden Beat', 'Golden Frequency', 'Golden Signal', 'Amber Pulse', 'Solar Rhythm', 'Honey Tempo'],
  },
}

export const ARTWORK_ORDER = Object.keys(ARTWORKS) as ArtworkId[]

const IMAGE_WIDTHS = [400, 800, 1200]

export function buildArtworkImage(artworkId: ArtworkId, name: string, view?: number): Image {
  const artwork = ARTWORKS[artworkId]
  const viewLabel = view ? `, visualização ${view}` : ''
  return {
    alt: `${name}: ${artwork.description}${viewLabel}`,
    url: `/images/nfts/${artworkId}-800.webp`,
    sources: IMAGE_WIDTHS.map((width) => ({ url: `/images/nfts/${artworkId}-${width}.webp`, width })),
  }
}

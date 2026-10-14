import type { ArtworkId } from './artworks'

export type JournalRecord = {
  id: string
  title: string
  excerpt: string
  publishedAt: string
  readingMinutes: number
  artwork: ArtworkId
}

export const JOURNAL_FIXTURE = {
  title: 'Diário da Cunhagem',
  subtitle: 'Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.',
  posts: [
    {
      id: 'como-funciona-a-propriedade-de-nfts',
      title: 'Como funciona a propriedade de NFTs',
      excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
      publishedAt: '2026-09-12T12:00:00.000Z',
      readingMinutes: 6,
      artwork: 'blazer-ape',
    },
    {
      id: '10-artistas-digitais-para-acompanhar',
      title: '10 artistas digitais para acompanhar',
      excerpt: 'Conheça criadores que moldam a cultura digital.',
      publishedAt: '2026-09-13T12:00:00.000Z',
      readingMinutes: 2,
      artwork: 'glasses-ape',
    },
    {
      id: 'raridade-atributos-e-procedencia',
      title: 'Raridade, atributos e procedência',
      excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
      publishedAt: '2026-09-15T12:00:00.000Z',
      readingMinutes: 3,
      artwork: 'bucket-hat-ape',
    },
    {
      id: 'como-proteger-sua-carteira',
      title: 'Como proteger sua carteira',
      excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
      publishedAt: '2026-09-15T15:00:00.000Z',
      readingMinutes: 2,
      artwork: 'headphones-ape',
    },
  ] satisfies JournalRecord[],
}

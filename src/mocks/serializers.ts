import type { Edition, NftDetail, NftSummary } from '@/api/contracts/nft'
import type { User } from '@/api/contracts/session'
import { buildArtworkImage } from './fixtures/artworks'
import { CATEGORY_LABELS, NETWORK_LABELS } from './fixtures/labels'
import type { NftRecord } from './fixtures/nfts'
import type { UserRecord } from './fixtures/users'

const GALLERY_VIEWS = 4

const SERIES_NAME = 'Kurio Editions'

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function availableTotal(record: NftRecord): number {
  return record.editions.reduce((total, edition) => total + edition.available, 0)
}

function defaultEdition(record: NftRecord): Edition {
  const available = record.editions.filter((edition) => edition.available > 0)
  const limited = available
    .filter((edition) => edition.supply !== null)
    .sort((a, b) => (b.supply ?? 0) - (a.supply ?? 0))
  return limited[0] ?? available[0] ?? record.editions[0]
}

export function toNftSummary(record: NftRecord): NftSummary {
  return {
    id: record.id,
    name: record.name,
    tokenId: record.tokenId,
    price: record.price,
    previousPrice: record.previousPrice,
    image: buildArtworkImage(record.artwork, record.name),
    network: { value: record.network, label: NETWORK_LABELS[record.network] },
    category: { value: record.category, label: CATEGORY_LABELS[record.category] },
    badge: record.isRare ? 'RARO' : null,
    available: availableTotal(record),
    listedAt: record.listedAt,
    version: record.version,
  }
}

export function toNftDetail(record: NftRecord): NftDetail {
  const network = NETWORK_LABELS[record.network]
  const { collection, creator, contract } = record
  const leadEdition = defaultEdition(record)
  return {
    ...toNftSummary(record),
    summary: `Um colecionável digital finalizado à mão da coleção ${SERIES_NAME}, verificado na ${network}, com arte desbloqueável e acesso para colecionadores.`,
    description: [
      `${record.name} é uma obra digital ${leadEdition.label} finalizada à mão da coleção ${SERIES_NAME}. Cada atributo fica armazenado nos metadados do token e verificado na ${network}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. ${creator.name} recebe ${creator.royaltyPercent}% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
    ],
    collection,
    attributes: record.attributes,
    gallery: Array.from({ length: GALLERY_VIEWS }, (_, index) => buildArtworkImage(record.artwork, record.name, index + 1)),
    editions: record.editions,
    defaultEditionId: leadEdition.id,
    rating: record.rating,
    creator,
    networkDetails: `Cunhado na ${network} com procedência imutável e metadados armazenados no IPFS.`,
    contract: {
      address: contract.address,
      standard: contract.standard,
      details: `${shortAddress(contract.address)} • Contrato inteligente ${contract.standard} verificado.`,
    },
    royaltyDetails: `Direitos autorais do criador: ${creator.royaltyPercent}% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.`,
  }
}

export function toUser(record: UserRecord): User {
  return {
    id: record.id,
    username: record.username,
    displayName: record.displayName,
    email: record.email,
    avatarUrl: record.avatarUrl,
    ensName: record.ensName,
  }
}

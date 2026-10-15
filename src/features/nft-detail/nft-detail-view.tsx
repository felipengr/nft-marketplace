import { Link, useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronLeft, Heart, Star } from 'lucide-react'
import { useRef, useState } from 'react'
import type { NftDetail } from '@/api/contracts/nft'
import { ShopIcon } from '@/components/icons/brand-icons'
import { NftPrice } from '@/components/nft/nft-price'
import { Button } from '@/components/ui/button'
import { CATALOG_SECTION_ID } from '@/features/catalog/catalog-search'
import { formatEth, multiplyEth } from '@/lib/money'
import { cn } from '@/lib/utils'
import { EditionPicker } from './edition-picker'
import { NftDetailTabs, type DetailTab } from './nft-detail-tabs'
import { MobileNftGallery, NftGallery } from './nft-gallery'
import { useNftActions } from './use-nft-actions'
import { formatRating } from './rating'
import { RatingStars } from './rating-stars'
import { QuantityStepper } from './quantity-stepper'
import { RelatedNfts } from './related-nfts'
import { ShareLinks } from './share-links'

type NftDetailViewProps = {
  nft: NftDetail
  editionId: string
  onEditionChange: (editionId: string) => void
}

function MetaList({ nft }: { nft: NftDetail }) {
  return (
    <dl className="space-y-2.5 text-[0.95rem] tracking-wide text-subtle">
      <div>
        <dt className="inline">ID do token:</dt>
        <dd className="ml-2 inline">{nft.tokenId}</dd>
      </div>
      <div>
        <dt className="inline">Coleção:</dt>
        <dd className="ml-2 inline">{nft.collection.name}</dd>
      </div>
      <div>
        <dt className="inline">Atributos:</dt>
        <dd className="ml-2 inline">{nft.attributes.join(', ')}</dd>
      </div>
    </dl>
  )
}

function useBack() {
  const canGoBack = useCanGoBack()
  const router = useRouter()
  const navigate = useNavigate()
  return () => (canGoBack ? router.history.back() : void navigate({ to: '/' }))
}

export function NftDetailView({ nft, editionId, onEditionChange }: NftDetailViewProps) {
  const edition = nft.editions.find((item) => item.id === editionId) ?? nft.editions[0]
  const maxQuantity = edition.maxPerOrder
  const [quantityState, setQuantityState] = useState({ editionId: edition.id, value: 1 })
  const quantity = quantityState.editionId === edition.id ? Math.min(quantityState.value, Math.max(maxQuantity, 1)) : 1
  const setQuantity = (value: number) => setQuantityState({ editionId: edition.id, value })
  const [tab, setTab] = useState<DetailTab>('details')
  const tabsRef = useRef<HTMLElement>(null)
  const goBack = useBack()
  const { toggleFavorite, addToCart, purchase, isFavorite, isAdding } = useNftActions()
  const favorite = isFavorite(nft.id)
  const soldOut = edition.available === 0
  const intent = { nft, editionId: edition.id, quantity }
  const shareUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/nfts/${nft.id}`

  function openReviews() {
    setTab('reviews')
    requestAnimationFrame(() => tabsRef.current?.scrollIntoView({ block: 'start' }))
  }

  const limitMessage = soldOut
    ? 'Edição esgotada. Escolha outra edição.'
    : `Máximo de ${maxQuantity} ${maxQuantity === 1 ? 'unidade' : 'unidades'} por pedido nesta edição.`

  return (
    <>
      <article aria-labelledby="nft-title" className="pb-28 md:pb-0">
        <div className="relative md:hidden">
          <div className="absolute inset-x-4 top-4 z-10 flex justify-between">
            <button
              type="button"
              onClick={goBack}
              aria-label="Voltar"
              className="flex size-10 items-center justify-center rounded-full border border-primary/40 bg-background/70 text-subtle backdrop-blur"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => toggleFavorite(nft)}
              aria-label={favorite ? 'Remover dos favoritos' : 'Favoritar'}
              aria-pressed={favorite}
              className="flex size-10 items-center justify-center rounded-full border border-primary/40 bg-background/70 text-subtle backdrop-blur"
            >
              <Heart className={cn('size-5', favorite && 'fill-primary text-primary')} aria-hidden />
            </button>
          </div>
          <div className="px-4 pt-4">
            <MobileNftGallery images={nft.gallery} />
          </div>
        </div>

        <div className="container-page hidden pt-8 md:block">
          <nav aria-label="Trilha de navegação" className="mb-5">
            <ol className="flex items-center gap-2 text-[0.95rem] font-bold">
              <li>
                <Link to="/" className="hover:text-primary">
                  Início
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link to="/" hash={CATALOG_SECTION_ID} className="hover:text-primary">
                  Mercado
                </Link>
              </li>
            </ol>
          </nav>
        </div>

        <div className="container-page grid gap-8 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,35.75rem)_minmax(0,1fr)] lg:gap-8">
          <NftGallery name={nft.name} images={nft.gallery} />

          <div className="relative -mt-4 space-y-5 rounded-t-3xl bg-surface px-4 pt-6 pb-2 md:mt-0 md:rounded-none md:bg-transparent md:p-0">
            <header className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h1 id="nft-title" className="text-xl font-bold tracking-wide md:text-[1.75rem]">
                  {nft.name}
                </h1>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary px-2 py-0.5 text-sm md:hidden">
                  <Star className="size-3.5 fill-primary text-primary" aria-hidden />
                  <span className="sr-only">Avaliação </span>
                  {formatRating(nft.rating.average)}
                  <span className="text-subtle">({nft.rating.count})</span>
                </span>
              </div>
              <div className="hidden flex-wrap items-center justify-between gap-3 border-b border-secondary pb-2 md:flex">
                <NftPrice price={nft.price} previousPrice={nft.previousPrice} className="text-[1.375rem]" />
                <button type="button" onClick={openReviews} className="flex items-center gap-2 text-[0.95rem] hover:text-primary">
                  <RatingStars average={nft.rating.average} />
                  {nft.rating.count} avaliações<span className="hidden lg:inline"> de colecionadores</span>
                </button>
              </div>
            </header>

            <section aria-labelledby="about-title" className="space-y-3">
              <h2 id="about-title" className="hidden font-bold md:block">
                Sobre este NFT:
              </h2>
              <p className="text-sm leading-6 tracking-wide text-subtle">{nft.summary}</p>
            </section>

            <EditionPicker editions={nft.editions} selectedId={edition.id} onSelect={onEditionChange} />

            <div className="hidden flex-wrap items-center justify-between gap-4 md:flex">
              <QuantityStepper value={quantity} max={maxQuantity} onChange={setQuantity} />
              <div className="flex items-center gap-2">
                <Button size="lg" className="h-10 w-32.5 font-bold" disabled={soldOut || isAdding} aria-busy={isAdding} onClick={() => purchase(intent)}>
                  COMPRAR
                </Button>
                <Button size="lg" variant="outline" className="h-10 font-normal" aria-pressed={favorite} onClick={() => toggleFavorite(nft)}>
                  <Heart aria-hidden className={cn('text-primary', favorite && 'fill-primary')} />
                  {favorite ? 'Favoritado' : 'Favoritar'}
                </Button>
              </div>
            </div>
            <p className="hidden text-xs text-subtle md:block" aria-live="polite">
              {limitMessage}
            </p>

            <MetaList nft={nft} />
            <div className="hidden md:block">
              <ShareLinks name={nft.name} url={shareUrl} />
            </div>
          </div>
        </div>

        <NftDetailTabs nft={nft} value={tab} onValueChange={setTab} sectionRef={tabsRef} />
        <RelatedNfts nftId={nft.id} />
      </article>

      <div
        role="region"
        aria-label="Comprar NFT"
        className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-secondary bg-surface px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:hidden"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm" aria-hidden>
              Qtd.
            </span>
            <QuantityStepper value={quantity} max={maxQuantity} onChange={setQuantity} size="sm" />
          </div>
          <p className="text-xl font-bold text-primary">
            <span className="sr-only">Total: </span>
            {formatEth(multiplyEth(nft.price, quantity))}
          </p>
        </div>
        <p className="sr-only" aria-live="polite">
          {limitMessage}
        </p>
        <div className="flex items-center gap-3">
          <Button
            className="h-14 flex-1 rounded-full bg-linear-to-r from-primary to-primary/70 text-base font-bold"
            disabled={soldOut}
            onClick={() => purchase(intent)}
          >
            {soldOut ? 'Edição esgotada' : 'Comprar NFT'}
          </Button>
          <button
            type="button"
            aria-label="Adicionar ao carrinho"
            disabled={soldOut}
            onClick={() => addToCart(intent)}
            className="flex size-14 items-center justify-center rounded-full border border-secondary bg-secondary/40 text-primary disabled:opacity-40"
          >
            <ShopIcon className="size-5" />
          </button>
        </div>
      </div>
    </>
  )
}

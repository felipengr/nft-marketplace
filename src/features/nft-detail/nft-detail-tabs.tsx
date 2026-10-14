import type { RefObject } from 'react'
import type { NftDetail } from '@/api/contracts/nft'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NftReviews } from './nft-reviews'

export type DetailTab = 'details' | 'reviews'

type NftDetailTabsProps = {
  nft: NftDetail
  value: DetailTab
  onValueChange: (value: DetailTab) => void
  sectionRef: RefObject<HTMLElement | null>
}

const TRIGGER_CLASS =
  'h-auto flex-none rounded-none border-0 border-b-[3px] border-transparent bg-transparent px-0 pb-1.5 text-base font-normal tracking-wide text-foreground shadow-none sm:text-lg data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-bold data-[state=active]:text-primary data-[state=active]:shadow-none'

function DetailBlock({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <h3 className="font-bold">{title}:</h3>
      <p className="text-sm leading-6 tracking-wide text-subtle">{children}</p>
    </div>
  )
}

export function NftDetailTabs({ nft, value, onValueChange, sectionRef }: NftDetailTabsProps) {
  return (
    <section ref={sectionRef} aria-label="Informações adicionais" className="container-page scroll-mt-6 pt-14 md:pt-24">
      <Tabs value={value} onValueChange={(next) => onValueChange(next as DetailTab)} className="gap-0">
        <TabsList variant="line" className="h-auto w-full justify-start gap-8 overflow-x-auto rounded-none border-b border-secondary p-0 sm:gap-10">
          <TabsTrigger value="details" className={TRIGGER_CLASS}>
            Detalhes do NFT
          </TabsTrigger>
          <TabsTrigger value="reviews" className={TRIGGER_CLASS}>
            Avaliações de colecionadores ({nft.rating.count})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-6 pt-5">
          <div className="space-y-6 text-sm leading-6 tracking-wide text-subtle">
            {nft.description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="space-y-4">
            <DetailBlock title="Rede">{nft.networkDetails}</DetailBlock>
            <DetailBlock title="Contrato">{nft.contract.details}</DetailBlock>
            <DetailBlock title="Direitos autorais">{nft.royaltyDetails}</DetailBlock>
          </div>
        </TabsContent>
        <TabsContent value="reviews" className="pt-5">
          <NftReviews nftId={nft.id} />
        </TabsContent>
      </Tabs>
    </section>
  )
}

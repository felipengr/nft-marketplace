import { useState, type FormEvent, type ReactNode } from 'react'
import { SearchIcon } from '@/components/icons/brand-icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useCatalogNavigation } from '@/features/catalog/use-catalog-navigation'

type SearchDialogProps = {
  trigger: ReactNode
}

export function SearchDialog({ trigger }: SearchDialogProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { searchCatalog } = useCatalogNavigation()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void searchCatalog(query)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-border bg-surface sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buscar NFTs</DialogTitle>
          <DialogDescription>Pesquise por nome, coleção, criador ou ID do token.</DialogDescription>
        </DialogHeader>
        <form role="search" onSubmit={handleSubmit} className="flex gap-2">
          <label htmlFor="global-search" className="sr-only">
            Termo de busca
          </label>
          <Input
            id="global-search"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex.: Emerald Ape"
            maxLength={80}
            className="h-10"
          />
          <Button type="submit" size="lg">
            <SearchIcon className="size-4" />
            Buscar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import type { Edition } from '@/api/contracts/nft'
import { cn } from '@/lib/utils'

type EditionPickerProps = {
  editions: Edition[]
  selectedId: string
  onSelect: (editionId: string) => void
}

function availabilityLabel(edition: Edition): string {
  if (edition.available === 0) return 'esgotada'
  if (edition.supply === null) return 'edição aberta'
  return `${edition.available} de ${edition.supply} disponíveis`
}

export function EditionPicker({ editions, selectedId, onSelect }: EditionPickerProps) {
  const selected = editions.find((edition) => edition.id === selectedId)

  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 font-bold">Edição:</legend>
      <div className="flex flex-wrap gap-2">
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          const checked = edition.id === selectedId
          return (
            <label
              key={edition.id}
              className={cn(
                'relative inline-flex h-7 cursor-pointer items-center rounded-full border px-2 text-sm tracking-wide transition-colors',
                'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
                checked ? 'border-primary text-primary' : 'border-secondary text-subtle hover:border-primary/60',
                soldOut && 'cursor-not-allowed text-muted-foreground line-through opacity-60 hover:border-secondary',
              )}
            >
              <input
                type="radio"
                name="edition"
                value={edition.id}
                checked={checked}
                disabled={soldOut}
                onChange={() => onSelect(edition.id)}
                className="sr-only"
              />
              {edition.label}
              <span className="sr-only">, {availabilityLabel(edition)}</span>
            </label>
          )
        })}
      </div>
      {selected ? (
        <p className="mt-2 text-xs text-subtle" aria-live="polite">
          {selected.supply === null
            ? 'Edição aberta, sem limite de tiragem.'
            : selected.available === 0
              ? 'Esta edição está esgotada.'
              : `${selected.available} de ${selected.supply} disponíveis nesta edição.`}
        </p>
      ) : null}
    </fieldset>
  )
}

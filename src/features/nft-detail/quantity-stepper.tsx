import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type QuantityStepperProps = {
  value: number
  max: number
  onChange: (value: number) => void
  size?: 'default' | 'sm'
  label?: string
}

export function QuantityStepper({ value, max, onChange, size = 'default', label = 'Quantidade' }: QuantityStepperProps) {
  const disabled = max < 1
  const buttonClass = cn(
    'flex items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-40',
    size === 'default' ? 'h-12 w-8' : 'h-7 w-5',
  )

  return (
    <div role="group" aria-label={label} className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        className={buttonClass}
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus className={size === 'default' ? 'size-5' : 'size-3.5'} aria-hidden />
      </button>
      <output aria-live="polite" aria-label={`${label}: ${value}`} className={cn('min-w-6 text-center tabular-nums', size === 'default' ? 'text-xl' : 'text-lg')}>
        {value}
      </output>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        className={buttonClass}
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus className={size === 'default' ? 'size-5' : 'size-3.5'} aria-hidden />
      </button>
    </div>
  )
}

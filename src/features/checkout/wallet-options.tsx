import { Wallet as WalletIcon } from 'lucide-react'
import { WALLET_NETWORK_LABELS, WALLET_PROVIDER_LABELS, type Wallet, type WalletProvider } from '@/api/contracts/wallet'
import { cn } from '@/lib/utils'
import { shortAddress } from './format-address'

const CARD_CLASS =
  'flex cursor-pointer items-center gap-4 rounded-xl border bg-surface px-4 py-3 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring'

function Radio({ checked }: { checked: boolean }) {
  return (
    <span aria-hidden className={cn('flex size-4 shrink-0 items-center justify-center rounded-full border', checked ? 'border-primary' : 'border-secondary')}>
      {checked ? <span className="size-2 rounded-full bg-primary" /> : null}
    </span>
  )
}

type SavedWalletsProps = {
  wallets: Wallet[]
  selectedId: string | null
  onSelect: (wallet: Wallet) => void
  onUseOther: () => void
}

export function SavedWallets({ wallets, selectedId, onSelect, onUseOther }: SavedWalletsProps) {
  return (
    <fieldset className="min-w-0 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <legend className="text-[0.95rem] font-bold">Carteira conectada</legend>
        <button type="button" onClick={onUseOther} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
          Trocar carteira
        </button>
      </div>
      {wallets.length === 0 ? (
        <p className="rounded-xl border border-secondary p-4 text-sm text-subtle">
          Você ainda não cadastrou carteiras. Preencha o endereço abaixo para usar outra carteira.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {wallets.map((wallet) => {
            const checked = wallet.id === selectedId
            return (
              <label key={wallet.id} className={cn(CARD_CLASS, checked ? 'border-primary' : 'border-transparent hover:border-primary/40')}>
                <input type="radio" name="saved-wallet" className="sr-only" checked={checked} onChange={() => onSelect(wallet)} />
                <Radio checked={checked} />
                <span className="min-w-0">
                  <span className="block font-bold">{wallet.label}</span>
                  <span className="block truncate text-sm text-subtle">{wallet.ensName ?? shortAddress(wallet.address)}</span>
                  <span className="block text-sm text-subtle">{WALLET_NETWORK_LABELS[wallet.network]}</span>
                </span>
              </label>
            )
          })}
        </div>
      )}
    </fieldset>
  )
}

const PROVIDER_INITIALS: Record<WalletProvider, string> = { walletconnect: 'W', metamask: 'M', coinbase: '' }

type ProviderPickerProps = {
  value: WalletProvider
  onChange: (provider: WalletProvider) => void
}

export function ProviderPicker({ value, onChange }: ProviderPickerProps) {
  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="mb-3 text-[0.95rem] font-bold">Carteira e rede</legend>
      {(Object.keys(WALLET_PROVIDER_LABELS) as WalletProvider[]).map((provider) => {
        const checked = provider === value
        return (
          <label key={provider} className={cn(CARD_CLASS, 'justify-between', checked ? 'border-primary' : 'border-secondary hover:border-primary/40')}>
            <input type="radio" name="provider" className="sr-only" checked={checked} onChange={() => onChange(provider)} />
            <span className="flex items-center gap-3">
              <span aria-hidden className="flex size-10 items-center justify-center rounded-full border border-secondary bg-background font-bold text-primary">
                {PROVIDER_INITIALS[provider] || <WalletIcon className="size-4" />}
              </span>
              {WALLET_PROVIDER_LABELS[provider]}
            </span>
            <Radio checked={checked} />
          </label>
        )
      })}
    </fieldset>
  )
}

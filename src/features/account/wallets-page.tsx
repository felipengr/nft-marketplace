import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { getErrorMessage } from '@/api/api-error'
import {
  WALLET_NETWORK_LABELS,
  WALLET_PROVIDER_LABELS,
  upsertWalletInputSchema,
  walletNetworkSchema,
  walletProviderSchema,
  type Wallet,
  type WalletKind,
  type WalletNetwork,
  type WalletProvider,
} from '@/api/contracts/wallet'
import { ErrorState } from '@/components/feedback/query-states'
import { FormAlert, SelectField, TextField } from '@/components/form/form-field'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { applyServerErrors } from '@/features/auth/apply-server-errors'
import { useWallets } from '@/features/checkout/use-checkout'
import { useDeleteWallet, useSaveWallet } from './use-account'

const walletFormSchema = upsertWalletInputSchema.extend({
  network: z.union([walletNetworkSchema, z.literal('')]).refine((value) => value !== '', { error: 'Selecione uma rede.' }),
  provider: z.union([walletProviderSchema, z.literal('')]).refine((value) => value !== '', { error: 'Selecione uma carteira.' }),
})

type WalletFormValues = z.input<typeof walletFormSchema>

type WalletFormOutput = z.output<typeof walletFormSchema>

const FIELDS = ['label', 'network', 'address', 'ensName', 'provider'] as const

function toFormValues(wallet: Partial<Wallet> | undefined, label: string): WalletFormValues {
  return {
    label: wallet?.label ?? label,
    network: wallet?.network ?? '',
    address: wallet?.address ?? '',
    ensName: wallet?.ensName ?? '',
    provider: wallet?.provider ?? '',
  }
}

type WalletFormProps = {
  kind: WalletKind
  initial: WalletFormValues
  onSaved: () => void
  extraAction?: React.ReactNode
}

function WalletForm({ kind, initial, onSaved, extraAction }: WalletFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const save = useSaveWallet(kind)
  const prefix = `wallet-${kind}`
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<WalletFormValues, unknown, WalletFormOutput>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: initial,
  })

  const onSubmit = handleSubmit((values) => {
    if (save.isPending) return
    setFormError(null)
    const input = {
      label: values.label,
      network: walletNetworkSchema.parse(values.network),
      address: values.address,
      ensName: values.ensName ?? '',
      provider: walletProviderSchema.parse(values.provider),
    }
    save.mutate(input, {
      onSuccess: () => {
        toast.success(kind === 'primary' ? 'Carteira principal salva.' : 'Carteira secundária salva.')
        onSaved()
      },
      onError: (error) => setFormError(applyServerErrors<WalletFormValues>(error, FIELDS, setError)),
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormAlert message={formError} />
      <div className="grid gap-x-7 gap-y-5 sm:grid-cols-2">
        <TextField id={`${prefix}-label`} label="Apelido da carteira" hideLabel={false} requiredMark autoComplete="off" error={errors.label?.message} {...register('label')} />
        <SelectField id={`${prefix}-network`} label="Rede" requiredMark error={errors.network?.message} {...register('network')}>
          <option value="">Selecione uma rede</option>
          {(Object.keys(WALLET_NETWORK_LABELS) as WalletNetwork[]).map((network) => (
            <option key={network} value={network}>
              {WALLET_NETWORK_LABELS[network]}
            </option>
          ))}
        </SelectField>
        <TextField
          id={`${prefix}-address`}
          label="Endereço da carteira"
          hideLabel={false}
          requiredMark
          placeholder="Endereço 0x da carteira"
          autoComplete="off"
          spellCheck={false}
          error={errors.address?.message}
          {...register('address')}
        />
        <TextField
          id={`${prefix}-ens`}
          label="ENS (opcional)"
          hideLabel={false}
          placeholder="ex.: nome.eth"
          autoComplete="off"
          error={errors.ensName?.message}
          {...register('ensName')}
        />
        <SelectField id={`${prefix}-provider`} label="Tipo de carteira" requiredMark error={errors.provider?.message} {...register('provider')}>
          <option value="">Selecione uma carteira</option>
          {(Object.keys(WALLET_PROVIDER_LABELS) as WalletProvider[]).map((provider) => (
            <option key={provider} value={provider}>
              {WALLET_PROVIDER_LABELS[provider]}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" className="h-10 font-bold" disabled={save.isPending} aria-busy={save.isPending}>
          {save.isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
          Salvar carteira
        </Button>
        {extraAction}
      </div>
    </form>
  )
}

function SectionHeader({ id, title, description, action }: { id: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 id={id} className="text-lg font-bold">
          {title}
        </h2>
        <p className="text-sm text-primary/90">{description}</p>
      </div>
      {action}
    </div>
  )
}

const LINK_BUTTON = 'font-bold text-primary underline-offset-4 hover:underline'

function WalletsContent({ wallets }: { wallets: Wallet[] }) {
  const primary = wallets.find((wallet) => wallet.kind === 'primary')
  const secondary = wallets.find((wallet) => wallet.kind === 'secondary')
  const [addingPrimary, setAddingPrimary] = useState(false)
  const [addingSecondary, setAddingSecondary] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const remove = useDeleteWallet()

  const secondaryInitial = secondary
    ? toFormValues(secondary, 'Reserva')
    : toFormValues(sameAsPrimary && primary ? { ...primary, label: 'Reserva' } : undefined, 'Reserva')

  return (
    <div className="space-y-12">
      <section aria-labelledby="primary-wallet-title">
        <SectionHeader
          id="primary-wallet-title"
          title="Carteira principal"
          description="Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados."
          action={
            !primary && !addingPrimary ? (
              <button type="button" className={LINK_BUTTON} onClick={() => setAddingPrimary(true)}>
                Adicionar
              </button>
            ) : null
          }
        />
        {primary || addingPrimary ? (
          <WalletForm key={primary?.id ?? 'new-primary'} kind="primary" initial={toFormValues(primary, 'Principal')} onSaved={() => setAddingPrimary(false)} />
        ) : (
          <p className="text-sm text-subtle">Você ainda não adicionou uma carteira principal.</p>
        )}
      </section>

      <section aria-labelledby="secondary-wallet-title">
        <SectionHeader
          id="secondary-wallet-title"
          title="Carteira secundária"
          description={secondary || addingSecondary ? 'Use como reserva no pagamento.' : 'Você ainda não adicionou uma carteira secundária.'}
          action={
            !secondary && !addingSecondary ? (
              <div className="flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={sameAsPrimary}
                    disabled={!primary}
                    onChange={(event) => setSameAsPrimary(event.target.checked)}
                  />
                  Igual à carteira principal
                </label>
                <button
                  type="button"
                  className={LINK_BUTTON}
                  disabled={!primary}
                  title={primary ? undefined : 'Cadastre a carteira principal primeiro'}
                  onClick={() => setAddingSecondary(true)}
                >
                  Adicionar
                </button>
              </div>
            ) : null
          }
        />
        {secondary || addingSecondary ? (
          <WalletForm
            key={secondary?.id ?? `new-secondary-${sameAsPrimary}`}
            kind="secondary"
            initial={secondaryInitial}
            onSaved={() => setAddingSecondary(false)}
            extraAction={
              secondary ? (
                <button
                  type="button"
                  className="text-sm underline-offset-4 hover:text-destructive hover:underline"
                  disabled={remove.isPending}
                  onClick={() =>
                    remove.mutate('secondary', {
                      onSuccess: () => toast.success('Carteira secundária removida.'),
                      onError: (error) => toast.error(getErrorMessage(error)),
                    })
                  }
                >
                  Remover carteira secundária
                </button>
              ) : (
                <button type="button" className="text-sm underline-offset-4 hover:underline" onClick={() => setAddingSecondary(false)}>
                  Cancelar
                </button>
              )
            }
          />
        ) : null}
      </section>
    </div>
  )
}

export function WalletsPage() {
  const { data, error, isPending, isError, isFetching, refetch } = useWallets()

  return (
    <div>
      <h1 className="sr-only">Carteiras</h1>
      {isPending ? (
        <div className="space-y-5" aria-busy="true" aria-label="Carregando carteiras">
          <Skeleton className="h-6 w-56" />
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-16" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <ErrorState title="Não foi possível carregar suas carteiras" error={error} onRetry={() => void refetch()} retrying={isFetching} />
      ) : (
        <WalletsContent wallets={data.items} />
      )}
    </div>
  )
}

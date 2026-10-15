import { z } from 'zod'
import type { Cart, Quote } from '@/api/contracts/cart'
import { ensLabelSchema, type PlaceOrderInput } from '@/api/contracts/order'
import { usernameSchema, type User } from '@/api/contracts/session'
import { evmAddressSchema, walletNetworkSchema, walletProviderSchema, type Wallet, type WalletConnection } from '@/api/contracts/wallet'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Use no máximo ${max} caracteres.` })

export const checkoutFormSchema = z.object({
  displayName: z.string().trim().min(2, { error: 'Informe o nome de exibição.' }).max(40),
  username: usernameSchema,
  profileName: z.string().trim().min(2, { error: 'Informe o nome do perfil.' }).max(40),
  email: z.email({ error: 'Informe um e-mail válido.' }),
  ensName: ensLabelSchema,
  walletId: z.string().nullable(),
  network: z.union([walletNetworkSchema, z.literal('')]).refine((value) => value !== '', { error: 'Selecione uma rede.' }),
  address: evmAddressSchema,
  secondary: optionalText(64),
  walletType: z.union([walletProviderSchema, z.literal('')]).refine((value) => value !== '', { error: 'Selecione uma carteira.' }),
  referralCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^([A-Z0-9-]{4,16})?$/, { error: 'Use de 4 a 16 letras, números ou hífen.' }),
  note: optionalText(280),
  provider: walletProviderSchema,
})

export type CheckoutFormValues = z.input<typeof checkoutFormSchema>

export type CheckoutFormOutput = z.output<typeof checkoutFormSchema>

function ensLabel(user: User, wallet: Wallet | undefined): string {
  const source = wallet?.ensName ?? (user.ensName ? `${user.ensName}.eth` : '')
  return source.replace(/\.eth$/, '').split('.').pop() ?? ''
}

export function walletDefaults(wallet: Wallet | undefined): Pick<CheckoutFormValues, 'walletId' | 'network' | 'address' | 'walletType' | 'provider'> {
  return {
    walletId: wallet?.id ?? null,
    network: wallet?.network ?? '',
    address: wallet?.address ?? '',
    walletType: wallet?.provider ?? '',
    provider: wallet?.provider ?? 'metamask',
  }
}

export function checkoutDefaults(user: User, wallets: Wallet[]): CheckoutFormValues {
  const primary = wallets.find((wallet) => wallet.kind === 'primary') ?? wallets[0]
  return {
    displayName: user.displayName,
    username: user.username,
    profileName: user.displayName,
    email: user.email,
    ensName: ensLabel(user, primary),
    secondary: wallets.find((wallet) => wallet.kind === 'secondary')?.ensName ?? '',
    referralCode: '',
    note: '',
    ...walletDefaults(primary),
  }
}

export function toPlaceOrderInput(values: CheckoutFormOutput, connection: WalletConnection, cart: Cart, quote: Quote): PlaceOrderInput {
  return {
    buyer: {
      displayName: values.displayName,
      username: values.username,
      profileName: values.profileName,
      email: values.email,
      ensName: values.ensName,
    },
    wallet: {
      walletId: values.walletId,
      address: values.address,
      network: walletNetworkSchema.parse(values.network),
      secondary: values.secondary || null,
    },
    provider: connection.provider,
    connectionId: connection.connectionId,
    referralCode: values.referralCode || null,
    note: values.note || null,
    expected: { cartVersion: cart.version, total: quote.total },
  }
}

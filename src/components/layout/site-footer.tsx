import { Link } from '@tanstack/react-router'
import { useState, type FormEvent, type ReactNode } from 'react'
import { z } from 'zod'
import { FacebookIcon, InstagramIcon, LinkedinIcon, TwitterIcon, YoutubeIcon } from '@/components/icons/social-icons'
import type { Category } from '@/api/contracts/nft'
import { CATALOG_SECTION_ID } from '@/features/catalog/catalog-search'
import { notifyComingSoon } from '@/lib/coming-soon'
import { cn } from '@/lib/utils'

const FEATURES = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    description: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    description: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    description: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const PROFILE_LINKS = ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse']

const HELP_LINKS = ['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item']

const COLLECTION_LINKS: Array<{ label: string; category: Category }> = [
  { label: 'Arte digital', category: 'digital-art' },
  { label: 'Fotografia', category: 'photography' },
  { label: 'Música', category: 'music' },
  { label: 'Arte 3D', category: '3d-art' },
  { label: 'Utilidade', category: 'utility' },
]

const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://www.facebook.com', icon: FacebookIcon },
  { label: 'Instagram', href: 'https://www.instagram.com', icon: InstagramIcon },
  { label: 'Twitter', href: 'https://twitter.com', icon: TwitterIcon },
  { label: 'LinkedIn', href: 'https://www.linkedin.com', icon: LinkedinIcon },
  { label: 'YouTube', href: 'https://www.youtube.com', icon: YoutubeIcon },
]

const LINK_CLASS = 'text-sm tracking-wide text-foreground/90 transition-colors hover:text-primary'

const emailSchema = z.email()

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  )
}

function ComingSoonLink({ label }: { label: string }) {
  return (
    <li>
      <button type="button" className={LINK_CLASS} onClick={() => notifyComingSoon(`“${label}”`)}>
        {label}
      </button>
    </li>
  )
}

function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!emailSchema.safeParse(email.trim()).success) {
      setError('Informe um e-mail válido.')
      return
    }
    setError(null)
    notifyComingSoon('A newsletter')
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-2">
      <label htmlFor="newsletter-email" className="sr-only">
        Seu e-mail
      </label>
      <div className="flex">
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="digite seu e-mail..."
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'newsletter-error' : 'newsletter-help'}
          className="h-10 min-w-0 flex-1 rounded-l-sm bg-secondary px-3 text-sm placeholder:text-muted-foreground aria-invalid:outline aria-invalid:outline-destructive"
        />
        <button type="submit" className="h-10 rounded-r-sm bg-primary px-4 text-base font-bold text-primary-foreground hover:bg-primary/85">
          Enviar
        </button>
      </div>
      {error ? (
        <p id="newsletter-error" role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      <p id="newsletter-help" className="text-xs leading-5 text-subtle">
        Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
      </p>
    </form>
  )
}

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('container-page pt-16 pb-28 md:pb-6', className)}>
      <div className="bg-surface">
        <div className="grid gap-8 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:px-10">
          {FEATURES.map((feature) => (
            <section key={feature.letter} className="lg:border-r lg:border-primary lg:pr-4 lg:not-first:pl-4">
              <span
                aria-hidden
                className="mb-4 flex size-[4.625rem] items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
              >
                {feature.letter}
              </span>
              <h2 className="mb-2 text-[1.0625rem] font-bold">{feature.title}</h2>
              <p className="text-sm leading-[1.375rem] text-subtle">{feature.description}</p>
            </section>
          ))}
          <section className="lg:pl-4">
            <h2 className="mb-3 text-lg leading-tight font-bold">Antecipe-se ao próximo lançamento</h2>
            <NewsletterForm />
          </section>
        </div>

        <div className="grid gap-4 bg-secondary px-6 py-6 text-sm sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <p className="font-bold tracking-[0.2em]">KURIO</p>
          <p>Feito para colecionadores, criadores e cultura</p>
          <p>
            <a href="mailto:contato@email.com" className="hover:text-primary">
              contato@email.com
            </a>
          </p>
          <p>
            <a href="tel:+551140028922" className="hover:text-primary">
              +55 11 4002 8922
            </a>
          </p>
        </div>

        <div className="grid gap-8 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <FooterColumn title="Meu perfil">
            {PROFILE_LINKS.map((label) => (
              <ComingSoonLink key={label} label={label} />
            ))}
          </FooterColumn>
          <FooterColumn title="Central de ajuda">
            {HELP_LINKS.map((label) => (
              <ComingSoonLink key={label} label={label} />
            ))}
          </FooterColumn>
          <FooterColumn title="Coleções">
            {COLLECTION_LINKS.map((link) => (
              <li key={link.category}>
                <Link to="/" search={{ categories: [link.category] }} hash={CATALOG_SECTION_ID} className={LINK_CLASS}>
                  {link.label}
                </Link>
              </li>
            ))}
          </FooterColumn>
          <div className="space-y-6">
            <div>
              <h2 className="mb-3 text-lg font-bold">Redes sociais</h2>
              <ul className="flex flex-wrap gap-2">
                {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${label} (abre em nova aba)`}
                      className="flex size-8 items-center justify-center rounded-sm border border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <Icon className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-lg font-bold">Carteiras compatíveis</h2>
              <p className="inline-flex rounded-sm border border-secondary bg-secondary/60 px-2.5 py-1.5 text-[0.625rem] font-bold tracking-wider text-primary">
                METAMASK • WALLETCONNECT • COINBASE
              </p>
            </div>
          </div>
        </div>
      </div>
      <p className="pt-5 text-center text-sm">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}

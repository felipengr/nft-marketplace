import { MailIcon } from '@/components/icons/brand-icons'
import { LinkedinIcon, TwitterIcon } from '@/components/icons/social-icons'

type ShareLinksProps = {
  name: string
  url: string
}

export function ShareLinks({ name, url }: ShareLinksProps) {
  const text = `Confira ${name} na Kurio`
  const links = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: <LinkedinIcon className="size-4" />,
      external: true,
    },
    {
      label: 'e-mail',
      href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
      icon: <MailIcon className="size-[1.125rem]" />,
      external: false,
    },
    {
      label: 'Twitter',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      icon: <TwitterIcon className="size-4" />,
      external: true,
    },
  ]

  return (
    <div className="flex items-center gap-3">
      <p className="font-bold">Compartilhar este NFT:</p>
      <ul className="flex items-center gap-2">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              aria-label={`Compartilhar por ${link.label}${link.external ? ' (abre em nova aba)' : ''}`}
              className="flex size-7 items-center justify-center rounded-sm text-foreground transition-colors hover:text-primary"
            >
              {link.icon}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

import { notifyComingSoon } from '@/lib/coming-soon'

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden focusable={false}>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.7-4.9h-4v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.8l4-3z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
    </svg>
  )
}

function FacebookLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden focusable={false}>
      <path fill="#1877F2" d="M14 8V6.2c0-.8.2-1.2 1.4-1.2H17V2h-2.7C11.4 2 10 3.6 10 6v2H8v3h2v11h4V11h2.6l.4-3z" />
    </svg>
  )
}

const BUTTON_CLASS =
  'flex h-10 w-full items-center justify-center gap-3 rounded-sm border border-secondary text-sm tracking-wide text-subtle transition-colors hover:border-primary/60 hover:text-foreground'

export function SocialSignIn() {
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-3 text-sm">
        <span aria-hidden className="h-px flex-1 bg-secondary" />
        Ou continue com
        <span aria-hidden className="h-px flex-1 bg-secondary" />
      </p>
      <button type="button" className={BUTTON_CLASS} onClick={() => notifyComingSoon('O login com Google')}>
        <GoogleLogo />
        Continuar com Google
      </button>
      <button type="button" className={BUTTON_CLASS} onClick={() => notifyComingSoon('O login com Facebook')}>
        <FacebookLogo />
        Continuar com Facebook
      </button>
    </div>
  )
}

import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { SocialSignIn } from './social-sign-in'

type AuthPageProps = {
  title: string
  description: string
  notice?: string
  children: ReactNode
  footer: ReactNode
}

export function AuthPage({ title, description, notice, children, footer }: AuthPageProps) {
  return (
    <div className="container-page flex justify-center py-8 md:py-16">
      <section
        aria-labelledby="auth-title"
        className="w-full max-w-[22.5rem] md:max-w-[31.25rem] md:border-b-[6px] md:border-b-primary md:bg-surface md:px-10 md:pt-10 md:pb-12"
      >
        <Link to="/" className="mt-12 mb-16 block text-center text-3xl font-bold tracking-[0.15em] md:hidden" aria-label="Kurio, página inicial">
          KURIO
        </Link>
        <h1 id="auth-title" className="mb-8 text-center md:mb-2 text-lg font-bold tracking-wide md:text-xl">
          {title}
        </h1>
        <p className="mb-8 hidden text-center text-sm leading-5 text-subtle md:block">{description}</p>
        {notice ? (
          <p role="status" className="mb-6 rounded-sm border border-primary/60 bg-primary/10 px-3 py-2 text-sm">
            {notice}
          </p>
        ) : null}
        <div className="md:mx-auto md:max-w-[21.25rem]">
          {children}
          <div className="mt-8">
            <SocialSignIn />
          </div>
          <p className="mt-10 text-center text-sm text-subtle">{footer}</p>
        </div>
      </section>
    </div>
  )
}

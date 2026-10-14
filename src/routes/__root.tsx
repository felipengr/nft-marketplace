import { HeadContent, Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { NotFoundPage } from '@/components/layout/not-found-page'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { Toaster } from '@/components/ui/sonner'
import type { RouterContext } from '@/router'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <NotFoundPage />,
})

function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <HeadContent />
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-sm bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <SiteFooter />
      <MobileBottomNav />
      <Toaster position="top-center" />
    </div>
  )
}

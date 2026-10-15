import { HeadContent, Outlet, createRootRouteWithContext, useRouter, useRouterState } from '@tanstack/react-router'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { NotFoundPage } from '@/components/layout/not-found-page'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { Toaster } from '@/components/ui/sonner'
import { AuthPromptProvider } from '@/features/auth/auth-dialog'
import { SessionManager } from '@/features/auth/session-manager'
import { RealtimeIndicator } from '@/realtime/realtime-indicator'
import { RealtimeProvider } from '@/realtime/realtime-provider'
import { cn } from '@/lib/utils'
import type { RouterContext } from '@/router'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <NotFoundPage />,
})

function useMobileChrome() {
  const router = useRouter()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [routes] = router.getMatchedRoutes(pathname)
  return {
    nav: routes.every((route) => route.options.staticData?.mobileNav !== false),
    footer: routes.every((route) => route.options.staticData?.mobileFooter !== false),
  }
}

function RootLayout() {
  const chrome = useMobileChrome()

  return (
    <AuthPromptProvider>
      <RealtimeProvider>
      <div className="flex min-h-dvh flex-col">
        <HeadContent />
        <SessionManager />
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
        <SiteFooter className={cn(!chrome.footer && 'hidden md:block', !chrome.nav && 'pb-6')} />
        {chrome.nav ? <MobileBottomNav /> : null}
        <RealtimeIndicator />
        <Toaster position="top-center" mobileOffset={{ top: 72 }} />
      </div>
      </RealtimeProvider>
    </AuthPromptProvider>
  )
}

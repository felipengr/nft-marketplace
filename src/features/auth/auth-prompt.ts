import { useRouter } from '@tanstack/react-router'
import { createContext, useCallback, useContext } from 'react'

export type AuthMode = 'login' | 'register'

export type AuthPromptContextValue = {
  openDialog: (mode: AuthMode, onAuthenticated?: () => void) => void
}

export const AuthPromptContext = createContext<AuthPromptContextValue | null>(null)

const DESKTOP_QUERY = '(min-width: 768px)'

export function useAuthPrompt() {
  const context = useContext(AuthPromptContext)
  const router = useRouter()
  if (!context) throw new Error('useAuthPrompt must be used inside AuthPromptProvider')
  const { openDialog } = context

  return useCallback(
    (mode: AuthMode = 'login', onAuthenticated?: () => void) => {
      if (window.matchMedia(DESKTOP_QUERY).matches) {
        openDialog(mode, onAuthenticated)
        return
      }
      void router.navigate({
        to: mode === 'login' ? '/login' : '/register',
        search: { redirect: router.state.location.href },
      })
    },
    [openDialog, router],
  )
}

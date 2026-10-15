import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { CloseIcon } from '@/components/icons/brand-icons'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { AuthPromptContext, type AuthMode } from './auth-prompt'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'
import { SocialSignIn } from './social-sign-in'

const DESCRIPTIONS: Record<AuthMode, string> = {
  login: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  register: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
}

function ModeSwitch({ mode, onChange }: { mode: AuthMode; onChange: (mode: AuthMode) => void }) {
  const item = (value: AuthMode, label: string) => (
    <button
      type="button"
      aria-pressed={mode === value}
      onClick={() => onChange(value)}
      className={cn('text-lg tracking-wide transition-colors', mode === value ? 'text-primary' : 'text-foreground hover:text-primary/80')}
    >
      {label}
    </button>
  )
  return (
    <div className="flex items-center justify-center gap-2">
      {item('login', 'Entrar')}
      <span aria-hidden className="h-5 w-px bg-primary" />
      {item('register', 'Criar conta')}
    </div>
  )
}

export function AuthPromptProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>('login')
  const callbackRef = useRef<(() => void) | undefined>(undefined)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const openDialog = useCallback((nextMode: AuthMode, onAuthenticated?: () => void) => {
    callbackRef.current = onAuthenticated
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setMode(nextMode)
    setOpen(true)
  }, [])

  const handleSuccess = useCallback(() => {
    setOpen(false)
    const callback = callbackRef.current
    callbackRef.current = undefined
    callback?.()
  }, [])

  const value = useMemo(() => ({ openDialog }), [openDialog])

  return (
    <AuthPromptContext.Provider value={value}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) callbackRef.current = undefined
        }}
      >
        <DialogContent
          showCloseButton={false}
          onCloseAutoFocus={(event) => {
            const target = returnFocusRef.current
            returnFocusRef.current = null
            if (target?.isConnected) {
              event.preventDefault()
              target.focus()
            }
          }}
          className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-none border-0 border-b-[6px] border-b-primary bg-surface px-10 pt-10 pb-12 sm:max-w-[31.25rem]"
        >
          <DialogClose
            aria-label="Fechar"
            className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-sm text-primary hover:bg-secondary"
          >
            <CloseIcon className="size-[1.125rem]" />
          </DialogClose>
          <DialogTitle className="sr-only">{mode === 'login' ? 'Entrar' : 'Criar conta'}</DialogTitle>
          <ModeSwitch mode={mode} onChange={setMode} />
          <DialogDescription className="mt-6 mb-6 text-center text-sm leading-5 text-foreground">{DESCRIPTIONS[mode]}</DialogDescription>
          <div className="mx-auto w-full max-w-[21.25rem] space-y-6">
            {mode === 'login' ? <LoginForm key="login" onSuccess={handleSuccess} /> : <RegisterForm key="register" onSuccess={handleSuccess} />}
          </div>
          <div className="mx-auto mt-6 w-full max-w-[21.25rem]">
            <SocialSignIn />
          </div>
        </DialogContent>
      </Dialog>
    </AuthPromptContext.Provider>
  )
}

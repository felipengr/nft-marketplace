import { Eye, EyeOff } from 'lucide-react'
import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hideLabel?: boolean
  inputClassName?: string
  requiredMark?: boolean
}

const INPUT_CLASS =
  'h-10 w-full rounded-sm border border-secondary bg-surface px-4 text-sm tracking-wide text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-primary focus-visible:outline-none aria-invalid:border-destructive'

function FieldLabel({ htmlFor, label, hidden, requiredMark }: { htmlFor: string; label: string; hidden: boolean; requiredMark: boolean }) {
  return (
    <label htmlFor={htmlFor} className={hidden ? 'sr-only' : 'mb-1.5 block text-[0.95rem] tracking-wide'}>
      {label}
      {requiredMark ? (
        <span aria-hidden className="ml-0.5 text-lg leading-none text-primary">
          *
        </span>
      ) : null}
    </label>
  )
}

function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={id} className="mt-1.5 text-xs text-destructive">
      {error}
    </p>
  ) : null
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hideLabel = true, className, inputClassName, id, requiredMark = false, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  return (
    <div className={className}>
      <FieldLabel htmlFor={inputId} label={label} hidden={hideLabel} requiredMark={requiredMark} />
      <input
        ref={ref}
        id={inputId}
        aria-required={requiredMark || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(INPUT_CLASS, inputClassName)}
        {...props}
      />
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
})

export const PasswordField = forwardRef<HTMLInputElement, Omit<TextFieldProps, 'type'>>(function PasswordField(
  { label, error, hideLabel = true, className, inputClassName, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const [visible, setVisible] = useState(false)
  return (
    <div className={className}>
      <label htmlFor={inputId} className={hideLabel ? 'sr-only' : 'mb-1.5 block text-sm font-semibold'}>
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(INPUT_CLASS, 'pr-12', inputClassName)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          aria-controls={inputId}
          className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-primary"
        >
          {visible ? <Eye className="size-5" aria-hidden /> : <EyeOff className="size-5" aria-hidden />}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
})

export function FormAlert({ message }: { message: string | null }) {
  return (
    <div aria-live="assertive">
      {message ? (
        <p role="alert" className="rounded-sm border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}
    </div>
  )
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
  requiredMark?: boolean
  children: ReactNode
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, error, requiredMark = false, className, id, children, ...props },
  ref,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const errorId = `${selectId}-error`
  return (
    <div className={className}>
      <FieldLabel htmlFor={selectId} label={label} hidden={false} requiredMark={requiredMark} />
      <select
        ref={ref}
        id={selectId}
        aria-required={requiredMark || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(INPUT_CLASS, 'appearance-auto bg-background px-3')}
        {...props}
      >
        {children}
      </select>
      <FieldError id={errorId} error={error} />
    </div>
  )
})

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, error, className, id, ...props },
  ref,
) {
  const generatedId = useId()
  const areaId = id ?? generatedId
  const errorId = `${areaId}-error`
  return (
    <div className={className}>
      <FieldLabel htmlFor={areaId} label={label} hidden={false} requiredMark={false} />
      <textarea
        ref={ref}
        id={areaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(INPUT_CLASS, 'h-36 resize-y py-3')}
        {...props}
      />
      <FieldError id={errorId} error={error} />
    </div>
  )
})

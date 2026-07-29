import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: ButtonVariant
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'border border-border bg-surface text-foreground hover:bg-muted',
  ghost: 'text-foreground hover:bg-muted',
}

export function Button({
  className,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      type={type}
      {...props}
    />
  )
}

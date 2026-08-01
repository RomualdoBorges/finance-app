import {
  AlertTriangle,
  CircleOff,
  Inbox,
  LoaderCircle,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from './Button'

type StateFrameProps = {
  readonly icon: LucideIcon
  readonly title: string
  readonly description?: string
  readonly action?: ReactNode
  readonly role?: 'status' | 'alert'
}

function StateFrame({
  icon: Icon,
  title,
  description,
  action,
  role,
}: StateFrameProps) {
  return (
    <div
      className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-border bg-surface p-6 text-center"
      role={role}
    >
      <span className="mb-4 grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon aria-hidden="true" size={22} />
      </span>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

type LoadingStateProps = {
  readonly title?: string
}

export function LoadingState({
  title = 'Carregando conteúdo…',
}: LoadingStateProps) {
  return (
    <div
      className="flex min-h-32 items-center justify-center gap-3 rounded-xl border border-border bg-surface p-6 text-sm font-medium text-foreground"
      role="status"
    >
      <LoaderCircle
        aria-hidden="true"
        className="animate-spin motion-reduce:animate-none"
        size={20}
      />
      <span>{title}</span>
    </div>
  )
}

type EmptyStateProps = {
  readonly title: string
  readonly description: string
  readonly action?: ReactNode
  readonly icon?: LucideIcon
}

export function EmptyState({
  title,
  description,
  action,
  icon = Inbox,
}: EmptyStateProps) {
  return (
    <StateFrame
      action={action}
      description={description}
      icon={icon}
      title={title}
    />
  )
}

type ErrorStateProps = {
  readonly title?: string
  readonly description: string
  readonly onRetry?: () => void
}

export function ErrorState({
  title = 'Não foi possível carregar',
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <StateFrame
      action={
        onRetry ? (
          <Button onClick={onRetry} variant="secondary">
            Tentar novamente
          </Button>
        ) : undefined
      }
      description={description}
      icon={AlertTriangle}
      role="alert"
      title={title}
    />
  )
}

type UnavailableStateProps = {
  readonly title?: string
  readonly description: string
}

export function UnavailableState({
  title = 'Recurso indisponível',
  description,
}: UnavailableStateProps) {
  return (
    <StateFrame
      description={description}
      icon={CircleOff}
      role="status"
      title={title}
    />
  )
}

type AuthFormErrorProps = {
  readonly message: string | null
}

export function AuthFormError({ message }: AuthFormErrorProps) {
  if (message === null) return null

  return (
    <div
      aria-live="assertive"
      className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-foreground"
      role="alert"
    >
      {message}
    </div>
  )
}

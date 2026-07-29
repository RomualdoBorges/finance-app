import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes } from 'react'

type AuthFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  readonly id: string
  readonly label: string
  readonly error?: string | undefined
  readonly allowPasswordVisibility?: boolean
}

export function AuthField({
  id,
  label,
  error,
  allowPasswordVisibility = false,
  type,
  ...inputProps
}: AuthFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const errorId = `${id}-error`
  const isPassword = type === 'password'
  const inputType =
    isPassword && isPasswordVisible && allowPasswordVisibility ? 'text' : type

  return (
    <div>
      <label className="mb-2 block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          aria-describedby={error === undefined ? undefined : errorId}
          aria-invalid={error === undefined ? undefined : true}
          className={[
            'min-h-11 w-full rounded-md border bg-background px-3 py-2 text-base text-foreground',
            'placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
            isPassword && allowPasswordVisibility ? 'pr-12' : '',
            error === undefined ? 'border-border' : 'border-danger',
            inputProps.className,
          ]
            .filter(Boolean)
            .join(' ')}
          id={id}
          type={inputType}
        />
        {isPassword && allowPasswordVisibility ? (
          <button
            aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute inset-y-0 right-0 inline-grid w-11 place-items-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            type="button"
          >
            {isPasswordVisible ? (
              <EyeOff aria-hidden="true" size={19} />
            ) : (
              <Eye aria-hidden="true" size={19} />
            )}
          </button>
        ) : null}
      </div>
      {error === undefined ? null : (
        <p className="mt-2 text-sm text-danger" id={errorId}>
          {error}
        </p>
      )}
    </div>
  )
}

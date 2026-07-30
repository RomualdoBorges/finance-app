import { Home, KeyRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { routePaths } from '../../routes/paths'

type NavigationItemsProps = {
  readonly onNavigate?: () => void
}

export function NavigationItems({ onNavigate }: NavigationItemsProps) {
  return (
    <ul className="space-y-1">
      <li>
        <NavLink
          className={({ isActive }) =>
            [
              'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            ].join(' ')
          }
          end
          onClick={onNavigate}
          to={routePaths.home}
        >
          <Home aria-hidden="true" size={19} />
          <span>Início</span>
        </NavLink>
      </li>
      <li>
        <NavLink
          className={({ isActive }) =>
            [
              'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            ].join(' ')
          }
          onClick={onNavigate}
          to={routePaths.updatePassword}
        >
          <KeyRound aria-hidden="true" size={19} />
          <span>Alterar senha</span>
        </NavLink>
      </li>
    </ul>
  )
}

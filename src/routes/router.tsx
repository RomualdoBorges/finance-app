import { createBrowserRouter } from 'react-router-dom'

import { HomePage } from '../features/home/pages/HomePage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { PasswordResetPage } from '../features/auth/pages/PasswordResetPage'
import { EmailVerificationPage } from '../features/auth/pages/EmailVerificationPage'
import { NotFoundPage } from '../features/not-found/pages/NotFoundPage'
import { AppLayout } from '../layouts/AppLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { ProtectedRouteGuard } from './guards/ProtectedRouteGuard'
import { PublicOnlyGuard } from './guards/PublicOnlyGuard'
import { VerifiedEmailGuard } from './guards/VerifiedEmailGuard'
import { EmailVerificationRouteGuard } from './guards/EmailVerificationRouteGuard'
import { routePaths } from './paths'

export const router = createBrowserRouter([
  {
    element: <PublicOnlyGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: routePaths.login, element: <LoginPage /> },
          { path: routePaths.register, element: <RegisterPage /> },
          { path: routePaths.passwordReset, element: <PasswordResetPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRouteGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            element: <EmailVerificationRouteGuard />,
            children: [
              {
                path: routePaths.emailVerification,
                element: <EmailVerificationPage />,
              },
            ],
          },
          {
            element: <VerifiedEmailGuard />,
            children: [
              { path: routePaths.home, element: <HomePage /> },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
])

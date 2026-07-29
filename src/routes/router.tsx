import { createBrowserRouter } from 'react-router-dom'

import { HomePage } from '../features/home/pages/HomePage'
import { NotFoundPage } from '../features/not-found/pages/NotFoundPage'
import { AppLayout } from '../layouts/AppLayout'
import { routePaths } from './paths'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: routePaths.home,
        element: <HomePage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])

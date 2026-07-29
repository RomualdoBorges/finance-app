import { createBrowserRouter } from 'react-router-dom'

import { HomePage } from '../../features/home/pages/HomePage'
import { NotFoundPage } from '../../features/not-found/pages/NotFoundPage'
import { BaseLayout } from '../layouts/BaseLayout'

export const router = createBrowserRouter([
  {
    element: <BaseLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])

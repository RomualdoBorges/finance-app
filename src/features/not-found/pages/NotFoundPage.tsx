import { Link } from 'react-router-dom'

import { routePaths } from '../../../routes/paths'

export function NotFoundPage() {
  return (
    <section
      className="mx-auto flex min-h-[calc(100vh-4.25rem)] max-w-3xl flex-col justify-center gap-4 px-6 py-12"
      aria-labelledby="not-found-title"
    >
      <p className="font-medium text-primary">Erro 404</p>
      <h1 className="text-3xl font-semibold" id="not-found-title">
        Página não encontrada
      </h1>
      <p className="text-muted-foreground">
        O endereço informado não corresponde a uma página disponível.
      </p>
      <p>
        <Link
          className="font-medium text-primary underline-offset-4 hover:underline"
          to={routePaths.home}
        >
          Voltar para a página inicial
        </Link>
      </p>
    </section>
  )
}

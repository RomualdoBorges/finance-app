import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="foundation-page" aria-labelledby="not-found-title">
      <p>Erro 404</p>
      <h1 id="not-found-title">Página não encontrada</h1>
      <p>O endereço informado não corresponde a uma página disponível.</p>
      <p>
        <Link className="text-link" to="/">
          Voltar para a página inicial
        </Link>
      </p>
    </section>
  )
}

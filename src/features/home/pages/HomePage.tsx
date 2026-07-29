import { CircleDollarSign } from 'lucide-react'

const installedLibraries = [
  'React Router',
  'TanStack Query',
  'Zustand',
  'React Hook Form',
  'Zod',
]

export function HomePage() {
  return (
    <section className="foundation-page" aria-labelledby="foundation-title">
      <p className="flex items-center gap-2">
        <CircleDollarSign aria-hidden="true" size={20} />
        <span>Financeiro</span>
      </p>
      <h1 id="foundation-title">Fundação da aplicação configurada</h1>
      <p>
        A estrutura inicial está pronta para receber as próximas etapas do
        produto.
      </p>

      <h2>Bibliotecas principais</h2>
      <ul>
        {installedLibraries.map((library) => (
          <li key={library}>{library}</li>
        ))}
      </ul>
    </section>
  )
}

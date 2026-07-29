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
    <section
      className="mx-auto flex min-h-[calc(100vh-4.25rem)] max-w-3xl flex-col justify-center gap-6 px-6 py-12"
      aria-labelledby="foundation-title"
    >
      <p className="flex items-center gap-2 font-medium text-primary">
        <CircleDollarSign aria-hidden="true" size={20} />
        <span>Financeiro</span>
      </p>
      <h1
        className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        id="foundation-title"
      >
        Fundação da aplicação configurada
      </h1>
      <p className="max-w-2xl text-muted-foreground">
        A estrutura inicial está pronta para receber as próximas etapas do
        produto.
      </p>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Bibliotecas principais
        </h2>
        <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          {installedLibraries.map((library) => (
            <li className="rounded-md bg-muted px-3 py-2" key={library}>
              {library}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

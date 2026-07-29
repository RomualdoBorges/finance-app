import { Blocks, ShieldCheck, Smartphone } from 'lucide-react'

const foundations = [
  {
    title: 'Estrutura preparada',
    description: 'Uma base organizada para receber os módulos do produto.',
    Icon: Blocks,
  },
  {
    title: 'Experiência responsiva',
    description: 'Navegação adaptada para telas grandes e pequenas.',
    Icon: Smartphone,
  },
  {
    title: 'Interface confiável',
    description: 'Estados claros e padrões acessíveis para cada jornada.',
    Icon: ShieldCheck,
  },
]

export function HomePage() {
  return (
    <section className="space-y-8" aria-labelledby="foundation-title">
      <div className="max-w-2xl">
        <p className="mb-3 text-sm font-semibold text-primary">Visão geral</p>
        <h1
          className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          id="foundation-title"
        >
          Fundação da aplicação configurada
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          A estrutura visual está pronta para receber as próximas etapas, sem
          antecipar informações ou funcionalidades financeiras.
        </p>
      </div>

      <ul className="grid gap-4 md:grid-cols-3">
        {foundations.map(({ title, description, Icon }) => (
          <li
            className="rounded-xl border border-border bg-surface p-5"
            key={title}
          >
            <span className="grid size-10 place-items-center rounded-lg bg-muted text-primary">
              <Icon aria-hidden="true" size={21} />
            </span>
            <h2 className="mt-4 font-semibold text-foreground">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="font-semibold text-foreground">Próximas etapas</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Os recursos do produto serão construídos gradualmente sobre esta
          fundação.
        </p>
      </div>
    </section>
  )
}

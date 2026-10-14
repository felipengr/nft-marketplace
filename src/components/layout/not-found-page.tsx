import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

type NotFoundPageProps = {
  title?: string
  description?: string
}

export function NotFoundPage({
  title = 'Página não encontrada',
  description = 'O endereço que você acessou não existe ou foi movido.',
}: NotFoundPageProps) {
  return (
    <section className="container-page flex flex-col items-center py-24 text-center" aria-labelledby="not-found-title">
      <p className="mb-3 text-sm font-bold tracking-[0.2em] text-primary">ERRO 404</p>
      <h1 id="not-found-title" className="mb-3 text-3xl font-bold">
        {title}
      </h1>
      <p className="mb-8 max-w-md text-subtle">{description}</p>
      <Button asChild size="lg">
        <Link to="/">Voltar para o início</Link>
      </Button>
    </section>
  )
}

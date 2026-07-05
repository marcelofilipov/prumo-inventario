import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '../lib/auth-context'

export function HomePage() {
  const { user } = useAuth()

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold text-foreground">Prumo</h1>
      <p className="mt-2 text-muted-foreground">
        Bem-vindo(a), <strong className="text-foreground">{user?.email}</strong>.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Controle de inventário/patrimônio</CardTitle>
          <CardDescription>Gerencie os itens de patrimônio da Loja.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/itens" className={buttonVariants({ variant: 'default' })}>
            Ver itens do inventário
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}

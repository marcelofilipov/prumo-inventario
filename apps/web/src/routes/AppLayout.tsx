import { podeGerenciarUsuarios } from '@prumo/core'
import { signOutUser } from '@prumo/data'
import { NavLink, Outlet } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'
import { auth } from '../lib/firebase'
import { useAuth } from '../lib/auth-context'

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          'rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground',
          isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground',
        )
      }
    >
      {children}
    </NavLink>
  )
}

export function AppLayout() {
  const { user, papel } = useAuth()

  return (
    <div className="min-h-svh bg-background">
      <header className="flex h-16 items-center justify-between border-b bg-card px-4 sm:px-6">
        <div className="flex items-center gap-1">
          <span className="mr-3 font-heading text-lg font-semibold text-primary dark:text-primary">
            Prumo
          </span>
          <NavItem to="/">Início</NavItem>
          <NavItem to="/itens">Itens</NavItem>
          {podeGerenciarUsuarios(papel) && <NavItem to="/admin/usuarios">Usuários</NavItem>}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            {papel && (
              <Badge variant="gold" className="capitalize">
                {papel}
              </Badge>
            )}
          </div>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={() => signOutUser(auth)}>
            Sair
          </Button>
        </div>
      </header>

      {!papel && (
        <p className="bg-gold/20 px-4 py-3 text-sm text-gold-foreground sm:px-6 dark:bg-gold/10">
          Seu login funcionou, mas você ainda não tem acesso a esta Loja. Peça a um administrador
          para adicionar o seu usuário na tela <strong>Usuários</strong>. Se o seu papel mudou há
          pouco, saia e entre novamente para atualizar o acesso.
        </p>
      )}

      <Outlet />
    </div>
  )
}

import type { PapelUsuario } from '@prumo/core'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'

/**
 * Guard de rota por papel. É apenas UX — a segurança real está nas regras do
 * Firestore. Quem não tem o papel exigido é redirecionado para a listagem de
 * itens.
 */
export function RequirePapel({ permitido }: { permitido: PapelUsuario[] }) {
  const { papel, loading } = useAuth()

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </main>
    )
  }

  if (!papel || !permitido.includes(papel)) {
    return <Navigate to="/itens" replace />
  }

  return <Outlet />
}

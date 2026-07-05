import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

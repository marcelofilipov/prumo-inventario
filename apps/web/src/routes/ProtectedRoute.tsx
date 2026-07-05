import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main style={{ maxWidth: 640, margin: '4rem auto', padding: '0 1rem' }}>
        <p>Carregando…</p>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

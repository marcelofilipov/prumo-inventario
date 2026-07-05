import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'

export function HomePage() {
  const { user } = useAuth()

  return (
    <main style={{ maxWidth: 640, margin: '4rem auto', padding: '0 1rem' }}>
      <h1>Prumo</h1>
      <p>
        Bem-vindo(a), <strong>{user?.email}</strong>.
      </p>
      <p>
        Controle de inventário/patrimônio da Loja. Comece pela{' '}
        <Link to="/itens">lista de itens</Link>.
      </p>
    </main>
  )
}

import { signOutUser } from '@prumo/data'
import { NavLink, Outlet } from 'react-router-dom'
import { auth } from '../lib/firebase'
import { useAuth } from '../lib/auth-context'

export function AppLayout() {
  const { user, papel } = useAuth()

  return (
    <div>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #ddd',
        }}
      >
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <NavLink to="/">Início</NavLink>
          <NavLink to="/itens">Itens</NavLink>
        </nav>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>
            {user?.email}
            {papel ? ` (${papel})` : ''}
          </span>
          <button type="button" onClick={() => signOutUser(auth)}>
            Sair
          </button>
        </div>
      </header>

      {!papel && (
        <p style={{ background: '#fef3c7', color: '#92400e', padding: '0.75rem 1.5rem', margin: 0 }}>
          Seu login funcionou, mas você ainda não tem um papel atribuído
          nesta Loja. Peça a um administrador para cadastrar seu usuário em{' '}
          <code>lojas/{'{lojaId}'}/membros/{user?.uid}</code> no Firestore.
        </p>
      )}

      <Outlet />
    </div>
  )
}

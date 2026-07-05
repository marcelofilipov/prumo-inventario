import { signOutUser } from '@prumo/data'
import { auth } from '../lib/firebase'
import { useAuth } from '../lib/auth-context'

export function HomePage() {
  const { user, papel } = useAuth()

  return (
    <main style={{ maxWidth: 640, margin: '4rem auto', padding: '0 1rem' }}>
      <h1>Prumo</h1>
      <p>
        Logado como <strong>{user?.email}</strong>
        {papel ? ` (${papel})` : ''}
      </p>

      {!papel && (
        <p style={{ color: '#b45309' }}>
          Seu login funcionou, mas você ainda não tem um papel atribuído
          nesta Loja. Peça a um administrador para cadastrar seu usuário em{' '}
          <code>lojas/{'{lojaId}'}/membros/{user?.uid}</code> no Firestore.
        </p>
      )}

      <p>
        Controle de inventário/patrimônio. CRUD de itens ainda não
        implementado — ver <code>PROMPT.md</code> na raiz do repositório.
      </p>

      <button type="button" onClick={() => signOutUser(auth)}>
        Sair
      </button>
    </main>
  )
}

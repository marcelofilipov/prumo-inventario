import { signIn } from '@prumo/data'
import { FirebaseError } from 'firebase/app'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { auth } from '../lib/firebase'
import { useAuth } from '../lib/auth-context'

function mensagemDeErro(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'E-mail ou senha inválidos.'
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Aguarde um pouco e tente novamente.'
      default:
        return 'Não foi possível entrar. Tente novamente.'
    }
  }
  return 'Não foi possível entrar. Tente novamente.'
}

export function LoginPage() {
  const { user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await signIn(auth, email, senha)
    } catch (error) {
      setErro(mensagemDeErro(error))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main style={{ maxWidth: 360, margin: '6rem auto', padding: '0 1rem' }}>
      <h1>Prumo</h1>
      <p>Entrar no controle de inventário</p>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <label>
          E-mail
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: 'block', width: '100%' }}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            required
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={{ display: 'block', width: '100%' }}
          />
        </label>
        {erro && <p role="alert" style={{ color: 'crimson' }}>{erro}</p>}
        <button type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}

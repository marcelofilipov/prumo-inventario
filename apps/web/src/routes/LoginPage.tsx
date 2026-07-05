import { signIn } from '@prumo/data'
import { FirebaseError } from 'firebase/app'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="gap-1">
          <CardTitle className="font-heading text-2xl text-primary dark:text-primary">Prumo</CardTitle>
          <CardDescription>Entrar no controle de inventário</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                required
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            {erro && (
              <p role="alert" className="text-sm text-destructive">
                {erro}
              </p>
            )}
            <Button type="submit" disabled={enviando} className="mt-1">
              {enviando ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

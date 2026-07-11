import type { PapelUsuario } from '@prumo/core'
import { observeAuthState } from '@prumo/data'
import type { User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db, lojaId } from './firebase'

interface AuthState {
  loading: boolean
  user: User | null
  papel: PapelUsuario | null
}

const AuthContext = createContext<AuthState>({
  loading: true,
  user: null,
  papel: null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    loading: true,
    user: null,
    papel: null,
  })

  useEffect(() => {
    let unsubMembro: (() => void) | null = null

    const unsubAuth = observeAuthState(auth, (user) => {
      unsubMembro?.()
      unsubMembro = null

      if (!user) {
        setState({ loading: false, user: null, papel: null })
        return
      }

      // O papel vem do documento lojas/{lojaId}/membros/{uid}. Escutar o doc
      // faz a UI reagir ao vivo se um admin mudar o papel ou desativar o
      // usuário — sem depender de refresh de token. Membro desativado (ou sem
      // doc) fica sem papel.
      unsubMembro = onSnapshot(
        doc(db, `lojas/${lojaId}/membros/${user.uid}`),
        (snap) => {
          const dados = snap.exists() ? snap.data() : null
          const papel = dados && dados.disabled !== true ? (dados.papel as PapelUsuario) : null
          setState({ loading: false, user, papel })
        },
        () => setState({ loading: false, user, papel: null }),
      )
    })

    return () => {
      unsubMembro?.()
      unsubAuth()
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}

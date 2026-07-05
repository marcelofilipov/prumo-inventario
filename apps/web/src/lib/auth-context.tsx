import type { Membro, PapelUsuario } from '@prumo/core'
import { FirestoreMembroRepository, observeAuthState } from '@prumo/data'
import type { User } from 'firebase/auth'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
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

  const membroRepository = useMemo(() => new FirestoreMembroRepository(db), [])

  useEffect(() => {
    const unsubscribe = observeAuthState(auth, async (user) => {
      if (!user) {
        setState({ loading: false, user: null, papel: null })
        return
      }

      let membro: Membro | null = null
      try {
        membro = await membroRepository.getMembro(lojaId, user.uid)
      } catch {
        // Sem documento em lojas/{lojaId}/membros/{uid} (ou sem permissão
        // de leitura) -> tratamos como usuário autenticado mas sem papel
        // atribuído na Loja ainda.
        membro = null
      }

      setState({ loading: false, user, papel: membro?.papel ?? null })
    })

    return unsubscribe
  }, [membroRepository])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}

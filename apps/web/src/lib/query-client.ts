import { QueryClient } from '@tanstack/react-query'

/**
 * Cache em memória do TanStack Query (sem persistência em
 * localStorage/IndexedDB nesta versão). `staleTime` padrão curto porque o
 * dado de inventário é operacional — quantidade em estoque muda com
 * frequência. As queries de listagem sobrescrevem esse valor conforme a
 * necessidade (ver `useItensPaginados`).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      refetchOnWindowFocus: true,
    },
  },
})

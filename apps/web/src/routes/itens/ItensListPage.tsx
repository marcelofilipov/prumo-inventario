import {
  CATEGORIA_LABELS,
  type FiltroItens,
  type ItemInventario,
  STATUS_LABELS,
  aplicarFiltroItens,
  podeGerenciarItens,
} from '@prumo/core'
import { Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '../../lib/auth-context'
import { useExcluirItem } from '../../lib/use-itens-mutations'
import { useItensPaginados } from '../../lib/use-itens-paginados'

interface FiltroForm {
  descricao: string
  codigoLegado: string
  observacao: string
  adquiridoDe: string
  adquiridoAte: string
}

const filtroVazio: FiltroForm = {
  descricao: '',
  codigoLegado: '',
  observacao: '',
  adquiridoDe: '',
  adquiridoAte: '',
}

const STATUS_BADGE_VARIANT: Record<ItemInventario['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ativo: 'secondary',
  emprestado: 'outline',
  manutencao: 'outline',
  baixado: 'destructive',
}

function paraFiltroItens(form: FiltroForm): FiltroItens {
  return {
    descricao: form.descricao || undefined,
    codigoLegado: form.codigoLegado || undefined,
    observacao: form.observacao || undefined,
    adquiridoDe: form.adquiridoDe ? new Date(`${form.adquiridoDe}T00:00:00`) : undefined,
    adquiridoAte: form.adquiridoAte ? new Date(`${form.adquiridoAte}T23:59:59`) : undefined,
  }
}

export function ItensListPage() {
  const { papel } = useAuth()
  const podeGerenciar = podeGerenciarItens(papel)

  const [form, setForm] = useState<FiltroForm>(filtroVazio)
  const [filtroAplicado, setFiltroAplicado] = useState<FiltroItens>({})

  const {
    data,
    status,
    isRefetchError,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useItensPaginados()

  const excluir = useExcluirItem()

  // Achata as páginas carregadas e aplica o refino client-side. A ordenação
  // vem do Firestore (orderBy descricao), mas reordenamos por localeCompare
  // pt-BR para tratar acentuação de forma consistente na exibição.
  const itensVisiveis = useMemo(() => {
    const carregados = data?.pages.flatMap((pagina) => pagina.itens) ?? []
    const filtrados = aplicarFiltroItens(carregados, filtroAplicado)
    return filtrados.sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR'))
  }, [data, filtroAplicado])

  // Scroll infinito: quando o sentinela entra na viewport, busca a próxima
  // página. Com filtro ativo e poucos resultados, o sentinela fica visível e
  // continua carregando páginas até haver correspondência ou esgotar a base.
  const sentinelaRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const alvo = sentinelaRef.current
    if (!alvo || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entradas) => {
        if (entradas[0]?.isIntersecting && !isFetchingNextPage && !isFetchNextPageError) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(alvo)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage])

  function handleFiltrar(event: React.FormEvent) {
    event.preventDefault()
    setFiltroAplicado(paraFiltroItens(form))
  }

  function handleLimpar() {
    setForm(filtroVazio)
    setFiltroAplicado({})
  }

  // Handlers estáveis no escopo do componente: chamar refetch/fetchNextPage
  // direto dentro dos blocos estreitados por isRefetchError/isFetchNextPageError
  // colapsa o tipo do TanStack Query para `never`.
  const aoRevalidar = () => {
    void refetch()
  }
  const aoBuscarProxima = () => {
    void fetchNextPage()
  }

  async function handleExcluir(item: ItemInventario) {
    const confirmado = window.confirm(
      `Excluir "${item.descricao}" (código ${item.codigoLegado})? Essa ação não pode ser desfeita.`,
    )
    if (!confirmado) return

    try {
      await excluir.mutateAsync(item.id)
    } catch {
      window.alert('Não foi possível excluir o item.')
    }
  }

  // Refetch em segundo plano com dados já na tela: avisa que o que está
  // exibido pode estar desatualizado, em vez de mostrá-lo como se fosse atual.
  const revalidando = isFetching && !isFetchingNextPage && status === 'success'

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Itens do inventário</h1>
        {podeGerenciar && (
          <Link to="/itens/novo" className={buttonVariants({ variant: 'default' })}>
            <Plus className="h-4 w-4" />
            Novo item
          </Link>
        )}
      </div>

      <form onSubmit={handleFiltrar} className="mt-6 flex flex-wrap items-end gap-3">
        <Input
          placeholder="Descrição"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          className="w-44"
        />
        <Input
          placeholder="Código"
          value={form.codigoLegado}
          onChange={(e) => setForm({ ...form, codigoLegado: e.target.value })}
          className="w-32"
        />
        <Input
          placeholder="Observação"
          value={form.observacao}
          onChange={(e) => setForm({ ...form, observacao: e.target.value })}
          className="w-44"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          De
          <Input
            type="date"
            value={form.adquiridoDe}
            onChange={(e) => setForm({ ...form, adquiridoDe: e.target.value })}
            className="w-40"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Até
          <Input
            type="date"
            value={form.adquiridoAte}
            onChange={(e) => setForm({ ...form, adquiridoAte: e.target.value })}
            className="w-40"
          />
        </label>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
        <Button type="button" variant="ghost" onClick={handleLimpar}>
          Limpar
        </Button>
      </form>

      <div className="mt-6">
        {status === 'pending' && <p className="text-sm text-muted-foreground">Carregando…</p>}

        {status === 'error' && (
          <div role="alert" className="text-sm text-destructive">
            <p>Não foi possível carregar os itens. Verifique sua permissão de acesso ou a conexão.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={aoRevalidar}>
              Tentar novamente
            </Button>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="mb-3 flex min-h-5 items-center gap-3 text-sm">
              {revalidando && <span className="text-muted-foreground">Atualizando…</span>}
              {isRefetchError && (
                <span role="alert" className="text-destructive">
                  Não foi possível atualizar — os dados exibidos podem estar desatualizados.{' '}
                  <button type="button" className="underline" onClick={aoRevalidar}>
                    Tentar de novo
                  </button>
                </span>
              )}
            </div>

            {itensVisiveis.length === 0 && !hasNextPage && (
              <p className="text-sm text-muted-foreground">Nenhum item encontrado.</p>
            )}

            {itensVisiveis.length === 0 && hasNextPage && (
              <p className="text-sm text-muted-foreground">Procurando em mais itens…</p>
            )}

            {itensVisiveis.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Qtde</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Status</TableHead>
                    {podeGerenciar && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itensVisiveis.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-foreground">{item.descricao}</TableCell>
                      <TableCell className="text-muted-foreground">{CATEGORIA_LABELS[item.categoria]}</TableCell>
                      <TableCell>{item.quantidade}</TableCell>
                      <TableCell className="text-muted-foreground">{item.codigoLegado}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE_VARIANT[item.status]}>{STATUS_LABELS[item.status]}</Badge>
                      </TableCell>
                      {podeGerenciar && (
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/itens/${item.id}/editar`}
                              className={buttonVariants({ variant: 'outline', size: 'sm' })}
                            >
                              Editar
                            </Link>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={excluir.isPending}
                              onClick={() => handleExcluir(item)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Sentinela do scroll infinito + estado de carregamento por página. */}
            <div ref={sentinelaRef} className="h-px" />
            {isFetchingNextPage && <p className="mt-4 text-sm text-muted-foreground">Carregando mais…</p>}
            {isFetchNextPageError && (
              <div role="alert" className="mt-4 text-sm text-destructive">
                Erro ao carregar mais itens.{' '}
                <button type="button" className="underline" onClick={aoBuscarProxima}>
                  Tentar de novo
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

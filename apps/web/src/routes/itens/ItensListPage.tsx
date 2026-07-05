import { CATEGORIA_LABELS, type FiltroItens, type ItemInventario, STATUS_LABELS, podeGerenciarItens } from '@prumo/core'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '../../lib/auth-context'
import { lojaId } from '../../lib/firebase'
import { inventoryRepository } from '../../lib/repositories'

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
  const [itens, setItens] = useState<ItemInventario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  async function carregar(filtro: FiltroItens = {}) {
    setCarregando(true)
    setErro(null)
    try {
      const resultado = await inventoryRepository.listItems(lojaId, filtro)
      resultado.sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR'))
      setItens(resultado)
    } catch {
      setErro('Não foi possível carregar os itens. Verifique sua permissão de acesso.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFiltrar(event: React.FormEvent) {
    event.preventDefault()
    carregar(paraFiltroItens(form))
  }

  function handleLimpar() {
    setForm(filtroVazio)
    carregar()
  }

  async function handleExcluir(item: ItemInventario) {
    const confirmado = window.confirm(
      `Excluir "${item.descricao}" (código ${item.codigoLegado})? Essa ação não pode ser desfeita.`,
    )
    if (!confirmado) return

    try {
      await inventoryRepository.deleteItem(lojaId, item.id)
      setItens((atual) => atual.filter((i) => i.id !== item.id))
    } catch {
      window.alert('Não foi possível excluir o item.')
    }
  }

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
        {carregando && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {erro && (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        )}
        {!carregando && !erro && itens.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum item encontrado.</p>
        )}

        {!carregando && !erro && itens.length > 0 && (
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
              {itens.map((item) => (
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
                        <Button variant="destructive" size="sm" onClick={() => handleExcluir(item)}>
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
      </div>
    </main>
  )
}

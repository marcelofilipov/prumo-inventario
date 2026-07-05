import { CATEGORIA_LABELS, type FiltroItens, type ItemInventario, STATUS_LABELS, podeGerenciarItens } from '@prumo/core'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
    <main style={{ maxWidth: 960, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1>Itens do inventário</h1>
        {podeGerenciar && <Link to="/itens/novo">+ Novo item</Link>}
      </div>

      <form
        onSubmit={handleFiltrar}
        style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', margin: '1rem 0' }}
      >
        <input
          placeholder="Descrição"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        />
        <input
          placeholder="Código"
          value={form.codigoLegado}
          onChange={(e) => setForm({ ...form, codigoLegado: e.target.value })}
        />
        <input
          placeholder="Observação"
          value={form.observacao}
          onChange={(e) => setForm({ ...form, observacao: e.target.value })}
        />
        <label>
          Adquirido de{' '}
          <input
            type="date"
            value={form.adquiridoDe}
            onChange={(e) => setForm({ ...form, adquiridoDe: e.target.value })}
          />
        </label>
        <label>
          a{' '}
          <input
            type="date"
            value={form.adquiridoAte}
            onChange={(e) => setForm({ ...form, adquiridoAte: e.target.value })}
          />
        </label>
        <button type="submit">Filtrar</button>
        <button type="button" onClick={handleLimpar}>
          Limpar
        </button>
      </form>

      {carregando && <p>Carregando…</p>}
      {erro && <p style={{ color: 'crimson' }}>{erro}</p>}

      {!carregando && !erro && itens.length === 0 && <p>Nenhum item encontrado.</p>}

      {!carregando && !erro && itens.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Qtde</th>
              <th>Código</th>
              <th>Status</th>
              {podeGerenciar && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{item.descricao}</td>
                <td>{CATEGORIA_LABELS[item.categoria]}</td>
                <td>{item.quantidade}</td>
                <td>{item.codigoLegado}</td>
                <td>{STATUS_LABELS[item.status]}</td>
                {podeGerenciar && (
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/itens/${item.id}/editar`}>Editar</Link>
                    <button type="button" onClick={() => handleExcluir(item)}>
                      Excluir
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}

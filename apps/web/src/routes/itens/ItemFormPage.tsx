import {
  CATEGORIA_LABELS,
  type Categoria,
  type NovoItemInventario,
  STATUS_LABELS,
  type StatusItem,
  novoItemInventarioSchema,
  podeGerenciarItens,
} from '@prumo/core'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../lib/auth-context'
import { lojaId } from '../../lib/firebase'
import { inventoryRepository } from '../../lib/repositories'

interface CamposForm {
  descricao: string
  quantidade: string
  codigoLegado: string
  categoria: Categoria
  localizacao: string
  observacao: string
  dataAquisicao: string
  valorEstimado: string
  status: StatusItem
}

const formVazio: CamposForm = {
  descricao: '',
  quantidade: '1',
  codigoLegado: '',
  categoria: 'outros',
  localizacao: '',
  observacao: '',
  dataAquisicao: '',
  valorEstimado: '',
  status: 'ativo',
}

function paraDataInput(data?: Date): string {
  if (!data) return ''
  return data.toISOString().slice(0, 10)
}

export function ItemFormPage() {
  const { id } = useParams<{ id: string }>()
  const emEdicao = Boolean(id)
  const navigate = useNavigate()
  const { user, papel } = useAuth()

  const [form, setForm] = useState<CamposForm>(formVazio)
  const [carregando, setCarregando] = useState(emEdicao)
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState<string[]>([])

  useEffect(() => {
    if (!id) return
    inventoryRepository.getItem(lojaId, id).then((item) => {
      if (!item) {
        setErros(['Item não encontrado.'])
        setCarregando(false)
        return
      }
      setForm({
        descricao: item.descricao,
        quantidade: String(item.quantidade),
        codigoLegado: item.codigoLegado,
        categoria: item.categoria,
        localizacao: item.localizacao ?? '',
        observacao: item.observacao ?? '',
        dataAquisicao: paraDataInput(item.dataAquisicao),
        valorEstimado: item.valorEstimado != null ? String(item.valorEstimado) : '',
        status: item.status,
      })
      setCarregando(false)
    })
  }, [id])

  if (!podeGerenciarItens(papel)) {
    return <Navigate to="/itens" replace />
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setErros([])

    const payload: Omit<NovoItemInventario, 'fotos'> = {
      lojaId,
      descricao: form.descricao.trim(),
      quantidade: Number(form.quantidade),
      codigoLegado: form.codigoLegado.trim(),
      categoria: form.categoria,
      localizacao: form.localizacao.trim() || undefined,
      observacao: form.observacao.trim() || undefined,
      dataAquisicao: form.dataAquisicao ? new Date(`${form.dataAquisicao}T00:00:00`) : undefined,
      valorEstimado: form.valorEstimado ? Number(form.valorEstimado) : undefined,
      status: form.status,
      criadoPor: user!.uid,
      atualizadoPor: user!.uid,
    }

    const validado = novoItemInventarioSchema.safeParse(payload)
    if (!validado.success) {
      setErros(validado.error.issues.map((issue) => issue.message))
      return
    }

    setSalvando(true)
    try {
      if (emEdicao && id) {
        await inventoryRepository.updateItem(lojaId, id, validado.data)
      } else {
        await inventoryRepository.createItem(validado.data)
      }
      navigate('/itens')
    } catch {
      setErros(['Não foi possível salvar o item. Tente novamente.'])
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <main style={{ maxWidth: 480, margin: '2rem auto', padding: '0 1rem' }}>
        <p>Carregando…</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 480, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>{emEdicao ? 'Editar item' : 'Novo item'}</h1>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <label>
          Descrição
          <input
            required
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            style={{ display: 'block', width: '100%' }}
          />
        </label>

        <label>
          Quantidade
          <input
            type="number"
            min={1}
            required
            value={form.quantidade}
            onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
            style={{ display: 'block', width: '100%' }}
          />
        </label>

        <label>
          Código
          <input
            required
            value={form.codigoLegado}
            onChange={(e) => setForm({ ...form, codigoLegado: e.target.value })}
            style={{ display: 'block', width: '100%' }}
          />
        </label>

        <label>
          Categoria
          <select
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value as Categoria })}
            style={{ display: 'block', width: '100%' }}
          >
            {Object.entries(CATEGORIA_LABELS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>

        <label>
          Status
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as StatusItem })}
            style={{ display: 'block', width: '100%' }}
          >
            {Object.entries(STATUS_LABELS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>

        <label>
          Localização
          <input
            value={form.localizacao}
            onChange={(e) => setForm({ ...form, localizacao: e.target.value })}
            style={{ display: 'block', width: '100%' }}
          />
        </label>

        <label>
          Data de aquisição
          <input
            type="date"
            value={form.dataAquisicao}
            onChange={(e) => setForm({ ...form, dataAquisicao: e.target.value })}
            style={{ display: 'block', width: '100%' }}
          />
        </label>

        <label>
          Valor estimado (R$)
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.valorEstimado}
            onChange={(e) => setForm({ ...form, valorEstimado: e.target.value })}
            style={{ display: 'block', width: '100%' }}
          />
        </label>

        <label>
          Observação
          <textarea
            value={form.observacao}
            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
            style={{ display: 'block', width: '100%' }}
          />
        </label>

        {erros.length > 0 && (
          <ul role="alert" style={{ color: 'crimson' }}>
            {erros.map((mensagem) => (
              <li key={mensagem}>{mensagem}</li>
            ))}
          </ul>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
          <button type="button" onClick={() => navigate('/itens')}>
            Cancelar
          </button>
        </div>
      </form>
    </main>
  )
}

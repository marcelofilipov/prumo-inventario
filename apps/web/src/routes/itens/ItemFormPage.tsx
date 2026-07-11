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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '../../lib/auth-context'
import { lojaId } from '../../lib/firebase'
import { inventoryRepository } from '../../lib/repositories'
import { useAtualizarItem, useCriarItem } from '../../lib/use-itens-mutations'

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

  const criar = useCriarItem()
  const atualizar = useAtualizarItem()

  const [form, setForm] = useState<CamposForm>(formVazio)
  const [carregando, setCarregando] = useState(emEdicao)
  const [erros, setErros] = useState<string[]>([])

  const salvando = criar.isPending || atualizar.isPending

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

    try {
      if (emEdicao && id) {
        await atualizar.mutateAsync({ id, patch: validado.data })
      } else {
        await criar.mutateAsync(validado.data)
      }
      navigate('/itens')
    } catch {
      setErros(['Não foi possível salvar o item. Tente novamente.'])
    }
  }

  if (carregando) {
    return (
      <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            {emEdicao ? 'Editar item' : 'Novo item'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                required
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min={1}
                  required
                  value={form.quantidade}
                  onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  required
                  value={form.codigoLegado}
                  onChange={(e) => setForm({ ...form, codigoLegado: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  id="categoria"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value as Categoria })}
                >
                  {Object.entries(CATEGORIA_LABELS).map(([valor, rotulo]) => (
                    <option key={valor} value={valor}>
                      {rotulo}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as StatusItem })}
                >
                  {Object.entries(STATUS_LABELS).map(([valor, rotulo]) => (
                    <option key={valor} value={valor}>
                      {rotulo}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="localizacao">Localização</Label>
              <Input
                id="localizacao"
                value={form.localizacao}
                onChange={(e) => setForm({ ...form, localizacao: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="dataAquisicao">Data de aquisição</Label>
                <Input
                  id="dataAquisicao"
                  type="date"
                  value={form.dataAquisicao}
                  onChange={(e) => setForm({ ...form, dataAquisicao: e.target.value })}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="valorEstimado">Valor estimado (R$)</Label>
                <Input
                  id="valorEstimado"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.valorEstimado}
                  onChange={(e) => setForm({ ...form, valorEstimado: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea
                id="observacao"
                value={form.observacao}
                onChange={(e) => setForm({ ...form, observacao: e.target.value })}
              />
            </div>

            {erros.length > 0 && (
              <ul role="alert" className="list-disc pl-5 text-sm text-destructive">
                {erros.map((mensagem) => (
                  <li key={mensagem}>{mensagem}</li>
                ))}
              </ul>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/itens')}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

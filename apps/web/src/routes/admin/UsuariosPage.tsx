import { type PapelUsuario, ROLE_LABELS } from '@prumo/core'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { inicializarContadoresSeNecessario } from '../../lib/membros-admin'
import { useMembros } from '../../lib/use-membros'
import {
  useAtualizarPapel,
  useCriarMembro,
  useDesativarMembro,
  useReativarMembro,
} from '../../lib/use-membros-mutations'

const PAPEIS: PapelUsuario[] = ['admin', 'editor', 'leitor']

function mensagemErro(erro: unknown): string {
  if (erro && typeof erro === 'object' && 'message' in erro) {
    return String((erro as { message: unknown }).message)
  }
  return 'Ocorreu um erro. Tente novamente.'
}

export function UsuariosPage() {
  const { data: membros, isPending, isError } = useMembros(true)

  const criar = useCriarMembro()
  const atualizarPapel = useAtualizarPapel()
  const desativar = useDesativarMembro()
  const reativar = useReativarMembro()

  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [papel, setPapel] = useState<PapelUsuario>('leitor')
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [contadoresProntos, setContadoresProntos] = useState(false)

  // Garante que o contador de papéis exista (backstop do "último admin") ANTES
  // de permitir criar — evita gravar um contador zerado na primeira vez. Se
  // falhar (ex.: regras não publicadas), o erro aparece já no carregamento.
  useEffect(() => {
    if (membros && membros.length > 0) {
      inicializarContadoresSeNecessario(membros)
        .then(() => setContadoresProntos(true))
        .catch((e) => setErro(mensagemErro(e)))
    }
  }, [membros])

  async function handleCriar(event: React.FormEvent) {
    event.preventDefault()
    setErro(null)
    setAviso(null)
    const emailCriado = email.trim()
    try {
      await criar.mutateAsync({ email: emailCriado, displayName: displayName.trim(), papel })
      setEmail('')
      setDisplayName('')
      setPapel('leitor')
      setAviso(`Usuário ${emailCriado} criado. Um e-mail para definir a senha foi enviado a ele.`)
    } catch (e) {
      setErro(mensagemErro(e))
    }
  }

  async function handleAtualizarPapel(uid: string, novoPapel: PapelUsuario) {
    setErro(null)
    setAviso(null)
    try {
      await atualizarPapel.mutateAsync({ uid, novoPapel })
    } catch (e) {
      setErro(mensagemErro(e))
    }
  }

  async function handleDesativarReativar(uid: string, desativado: boolean) {
    setErro(null)
    setAviso(null)
    try {
      if (desativado) await reativar.mutateAsync(uid)
      else await desativar.mutateAsync(uid)
    } catch (e) {
      setErro(mensagemErro(e))
    }
  }

  const acaoEmAndamento =
    criar.isPending || atualizarPapel.isPending || desativar.isPending || reativar.isPending

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-heading text-2xl font-semibold text-foreground">Usuários</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gerencie quem acessa esta Loja e o papel de cada um. Novos usuários entram como leitor por
        padrão e recebem um e-mail para definir a própria senha.
      </p>

      <form onSubmit={handleCriar} className="mt-6 flex flex-wrap items-end gap-3">
        <Input
          type="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-56"
        />
        <Input
          placeholder="Nome (opcional)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-48"
        />
        <Select value={papel} onChange={(e) => setPapel(e.target.value as PapelUsuario)} className="w-40">
          {PAPEIS.map((p) => (
            <option key={p} value={p}>
              {ROLE_LABELS[p]}
            </option>
          ))}
        </Select>
        <Button type="submit" disabled={criar.isPending || !contadoresProntos}>
          {criar.isPending ? 'Criando…' : 'Adicionar usuário'}
        </Button>
      </form>

      {erro && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {erro}
        </p>
      )}
      {aviso && (
        <p className="mt-4 rounded-md border border-gold/40 bg-gold/10 p-3 text-sm text-foreground">
          {aviso}
        </p>
      )}

      <div className="mt-6">
        {isPending && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {isError && (
          <p role="alert" className="text-sm text-destructive">
            Não foi possível carregar os usuários.
          </p>
        )}

        {membros && membros.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membros.map((membro) => (
                <TableRow key={membro.uid}>
                  <TableCell>
                    <div className="font-medium text-foreground">{membro.displayName || '—'}</div>
                    <div className="text-xs text-muted-foreground">{membro.email || membro.uid}</div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={membro.papel}
                      disabled={acaoEmAndamento || membro.disabled}
                      onChange={(e) => handleAtualizarPapel(membro.uid, e.target.value as PapelUsuario)}
                      className="w-36"
                    >
                      {PAPEIS.map((p) => (
                        <option key={p} value={p}>
                          {ROLE_LABELS[p]}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={membro.disabled ? 'destructive' : 'secondary'}>
                      {membro.disabled ? 'Desativado' : 'Ativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        variant={membro.disabled ? 'outline' : 'destructive'}
                        size="sm"
                        disabled={acaoEmAndamento}
                        onClick={() => handleDesativarReativar(membro.uid, membro.disabled)}
                      >
                        {membro.disabled ? 'Reativar' : 'Desativar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </main>
  )
}

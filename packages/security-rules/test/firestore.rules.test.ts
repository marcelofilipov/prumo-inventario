import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  type RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  type Firestore,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Caminho para o arquivo de regras real do repositório (raiz do monorepo).
const rulesPath = fileURLToPath(new URL('../../../firestore.rules', import.meta.url))

let testEnv: RulesTestEnvironment

// uid de teste para cada papel + um "de fora" (autenticado, mas não é membro).
const ADMIN = 'uid-admin'
const EDITOR = 'uid-editor'
const LEITOR = 'uid-leitor'
const FORA = 'uid-fora'
const ADMIN_OUTRA = 'uid-admin-loja2' // admin da loja2, não é membro da loja1

const LOJA = 'loja1'
const OUTRA_LOJA = 'loja2'

/** Item válido conforme o schema — base para os testes de escrita. */
function itemValido(overrides: Record<string, unknown> = {}) {
  return {
    lojaId: LOJA,
    descricao: 'Cadeira de madeira',
    quantidade: 4,
    codigoLegado: '4002',
    categoria: 'mobiliario',
    status: 'ativo',
    fotos: [],
    dataAquisicao: null,
    criadoPor: EDITOR,
    atualizadoPor: EDITOR,
    criadoEm: Timestamp.now(),
    atualizadoEm: Timestamp.now(),
    ...overrides,
  }
}

function db(uid?: string): Firestore {
  const ctx = uid ? testEnv.authenticatedContext(uid) : testEnv.unauthenticatedContext()
  return ctx.firestore() as unknown as Firestore
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-prumo',
    firestore: { rules: readFileSync(rulesPath, 'utf8') },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

// Antes de cada teste: limpa o banco e semeia membros + um item existente,
// ignorando as regras (só a semeadura, nunca a asserção).
beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const semeador = ctx.firestore()
    await setDoc(doc(semeador, `lojas/${LOJA}/membros/${ADMIN}`), { papel: 'admin' })
    await setDoc(doc(semeador, `lojas/${LOJA}/membros/${EDITOR}`), { papel: 'editor' })
    await setDoc(doc(semeador, `lojas/${LOJA}/membros/${LEITOR}`), { papel: 'leitor' })
    await setDoc(doc(semeador, `lojas/${OUTRA_LOJA}/membros/${ADMIN_OUTRA}`), { papel: 'admin' })
    await setDoc(doc(semeador, `lojas/${LOJA}/itens/item1`), itemValido())
  })
})

describe('leitura de itens', () => {
  it('membro (leitor) consegue ler item da sua loja', async () => {
    await assertSucceeds(getDoc(doc(db(LEITOR), `lojas/${LOJA}/itens/item1`)))
  })

  it('usuário autenticado que não é membro NÃO lê', async () => {
    await assertFails(getDoc(doc(db(FORA), `lojas/${LOJA}/itens/item1`)))
  })

  it('não autenticado NÃO lê', async () => {
    await assertFails(getDoc(doc(db(), `lojas/${LOJA}/itens/item1`)))
  })

  it('admin de outra loja NÃO lê item de loja1 (isolamento multi-tenant)', async () => {
    // ADMIN_OUTRA é admin da loja2, mas não é membro da loja1.
    await assertFails(getDoc(doc(db(ADMIN_OUTRA), `lojas/${LOJA}/itens/item1`)))
  })
})

describe('criação de itens', () => {
  it('editor cria item válido', async () => {
    await assertSucceeds(setDoc(doc(db(EDITOR), `lojas/${LOJA}/itens/novo`), itemValido()))
  })

  it('leitor NÃO cria item', async () => {
    await assertFails(setDoc(doc(db(LEITOR), `lojas/${LOJA}/itens/novo`), itemValido()))
  })

  it('editor NÃO cria item com quantidade não numérica', async () => {
    await assertFails(
      setDoc(doc(db(EDITOR), `lojas/${LOJA}/itens/novo`), itemValido({ quantidade: 'muitas' })),
    )
  })

  it('editor NÃO cria item com status fora do enum', async () => {
    await assertFails(
      setDoc(doc(db(EDITOR), `lojas/${LOJA}/itens/novo`), itemValido({ status: 'sumiu' })),
    )
  })

  it('editor NÃO cria item sem descrição', async () => {
    await assertFails(
      setDoc(doc(db(EDITOR), `lojas/${LOJA}/itens/novo`), itemValido({ descricao: '' })),
    )
  })

  it('editor NÃO cria item com lojaId divergente do caminho', async () => {
    await assertFails(
      setDoc(doc(db(EDITOR), `lojas/${LOJA}/itens/novo`), itemValido({ lojaId: 'outra' })),
    )
  })

  it('item com dataAquisicao null é aceito (campo em branco no app)', async () => {
    await assertSucceeds(
      setDoc(doc(db(EDITOR), `lojas/${LOJA}/itens/novo`), itemValido({ dataAquisicao: null })),
    )
  })
})

describe('edição e exclusão de itens', () => {
  it('editor atualiza item para estado válido', async () => {
    await assertSucceeds(
      updateDoc(doc(db(EDITOR), `lojas/${LOJA}/itens/item1`), {
        quantidade: 10,
        atualizadoEm: Timestamp.now(),
      }),
    )
  })

  it('editor NÃO atualiza item para status inválido', async () => {
    await assertFails(
      updateDoc(doc(db(EDITOR), `lojas/${LOJA}/itens/item1`), { status: 'inexistente' }),
    )
  })

  it('editor exclui item', async () => {
    await assertSucceeds(deleteDoc(doc(db(EDITOR), `lojas/${LOJA}/itens/item1`)))
  })

  it('leitor NÃO exclui item', async () => {
    await assertFails(deleteDoc(doc(db(LEITOR), `lojas/${LOJA}/itens/item1`)))
  })
})

describe('membros e papéis', () => {
  it('admin cria membro com papel válido', async () => {
    await assertSucceeds(
      setDoc(doc(db(ADMIN), `lojas/${LOJA}/membros/novo`), { papel: 'editor' }),
    )
  })

  it('admin NÃO cria membro com papel inválido', async () => {
    await assertFails(
      setDoc(doc(db(ADMIN), `lojas/${LOJA}/membros/novo`), { papel: 'super' }),
    )
  })

  it('editor NÃO escreve em membros (sem auto-escalonamento)', async () => {
    await assertFails(
      setDoc(doc(db(EDITOR), `lojas/${LOJA}/membros/${EDITOR}`), { papel: 'admin' }),
    )
  })

  it('leitor consegue ler membros da loja', async () => {
    await assertSucceeds(getDoc(doc(db(LEITOR), `lojas/${LOJA}/membros/${ADMIN}`)))
  })

  it('de fora NÃO lê membros', async () => {
    await assertFails(getDoc(doc(db(FORA), `lojas/${LOJA}/membros/${ADMIN}`)))
  })
})

describe('histórico / auditoria', () => {
  const historicoRef = () => collection(db(EDITOR), `lojas/${LOJA}/itens/item1/historico`)

  it('editor cria evento com o próprio uid e timestamp do servidor', async () => {
    await assertSucceeds(
      addDoc(historicoRef(), {
        acao: 'edicao',
        usuario: EDITOR,
        timestamp: serverTimestamp(),
      }),
    )
  })

  it('NÃO cria evento em nome de outro usuário', async () => {
    await assertFails(
      addDoc(historicoRef(), {
        acao: 'edicao',
        usuario: ADMIN,
        timestamp: serverTimestamp(),
      }),
    )
  })

  it('NÃO cria evento pós-datado (timestamp diferente do servidor)', async () => {
    await assertFails(
      addDoc(historicoRef(), {
        acao: 'edicao',
        usuario: EDITOR,
        timestamp: Timestamp.fromDate(new Date('2020-01-01')),
      }),
    )
  })

  it('histórico é imutável: não permite update nem delete', async () => {
    // Semeia um evento ignorando regras e tenta alterá-lo pela regra.
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `lojas/${LOJA}/itens/item1/historico/ev1`), {
        acao: 'edicao',
        usuario: EDITOR,
        timestamp: Timestamp.now(),
      })
    })
    await assertFails(
      updateDoc(doc(db(EDITOR), `lojas/${LOJA}/itens/item1/historico/ev1`), { acao: 'exclusao' }),
    )
    await assertFails(deleteDoc(doc(db(EDITOR), `lojas/${LOJA}/itens/item1/historico/ev1`)))
  })
})

// Sanidade: garante que a suíte está realmente falando com o emulador.
describe('ambiente', () => {
  it('FIRESTORE_EMULATOR_HOST está definido', () => {
    expect(process.env.FIRESTORE_EMULATOR_HOST).toBeTruthy()
  })
})

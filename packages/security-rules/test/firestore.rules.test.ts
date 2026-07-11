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

const rulesPath = fileURLToPath(new URL('../../../firestore.rules', import.meta.url))

let testEnv: RulesTestEnvironment

const LOJA = 'loja1'

// Autorização vem do documento membros/{uid} (papel + disabled).
function ctx(uid?: string): Firestore {
  const c = uid ? testEnv.authenticatedContext(uid) : testEnv.unauthenticatedContext()
  return c.firestore() as unknown as Firestore
}
const admin = () => ctx('uid-admin')
const editor = () => ctx('uid-editor')
const leitor = () => ctx('uid-leitor')
const desativado = () => ctx('uid-desativado')
const fora = () => ctx('uid-fora') // autenticado, sem doc de membro
const anonimo = () => ctx()

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
    criadoPor: 'uid-editor',
    atualizadoPor: 'uid-editor',
    criadoEm: Timestamp.now(),
    atualizadoEm: Timestamp.now(),
    ...overrides,
  }
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

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.withSecurityRulesDisabled(async (c) => {
    const s = c.firestore()
    await setDoc(doc(s, `lojas/${LOJA}/membros/uid-admin`), { papel: 'admin', disabled: false })
    await setDoc(doc(s, `lojas/${LOJA}/membros/uid-editor`), { papel: 'editor', disabled: false })
    await setDoc(doc(s, `lojas/${LOJA}/membros/uid-leitor`), { papel: 'leitor', disabled: false })
    await setDoc(doc(s, `lojas/${LOJA}/membros/uid-desativado`), { papel: 'editor', disabled: true })
    // Doc legado: só `papel`, SEM o campo `disabled` (como o admin piloto).
    await setDoc(doc(s, `lojas/${LOJA}/membros/uid-legado`), { papel: 'admin' })
    await setDoc(doc(s, `lojas/${LOJA}/itens/item1`), itemValido())
    await setDoc(doc(s, `lojas/${LOJA}/system/roleCounts`), { admin: 1, editor: 2 })
    await setDoc(doc(s, `lojas/${LOJA}/auditLogs/log1`), {
      targetUid: 'uid-editor',
      changedBy: 'uid-admin',
      action: 'create',
      timestamp: Timestamp.now(),
    })
  })
})

describe('leitura de itens', () => {
  it('membro ativo (leitor) lê', async () => {
    await assertSucceeds(getDoc(doc(leitor(), `lojas/${LOJA}/itens/item1`)))
  })
  it('membro DESATIVADO não lê', async () => {
    await assertFails(getDoc(doc(desativado(), `lojas/${LOJA}/itens/item1`)))
  })
  it('membro legado (sem campo disabled) lê normalmente', async () => {
    await assertSucceeds(getDoc(doc(ctx('uid-legado'), `lojas/${LOJA}/itens/item1`)))
  })
  it('sem doc de membro não lê; anônimo não lê', async () => {
    await assertFails(getDoc(doc(fora(), `lojas/${LOJA}/itens/item1`)))
    await assertFails(getDoc(doc(anonimo(), `lojas/${LOJA}/itens/item1`)))
  })
})

describe('escrita de itens', () => {
  it('editor cria item válido; leitor não', async () => {
    await assertSucceeds(setDoc(doc(editor(), `lojas/${LOJA}/itens/novo`), itemValido()))
    await assertFails(setDoc(doc(leitor(), `lojas/${LOJA}/itens/novo`), itemValido()))
  })
  it('editor desativado não cria', async () => {
    await assertFails(setDoc(doc(desativado(), `lojas/${LOJA}/itens/novo`), itemValido()))
  })
  it('rejeita status fora do enum e lojaId divergente', async () => {
    await assertFails(setDoc(doc(editor(), `lojas/${LOJA}/itens/novo`), itemValido({ status: 'x' })))
    await assertFails(setDoc(doc(editor(), `lojas/${LOJA}/itens/novo`), itemValido({ lojaId: 'outra' })))
  })
  it('editor exclui; leitor não', async () => {
    await assertSucceeds(deleteDoc(doc(editor(), `lojas/${LOJA}/itens/item1`)))
    await assertFails(deleteDoc(doc(leitor(), `lojas/${LOJA}/itens/item1`)))
  })
})

describe('membros', () => {
  it('admin lê qualquer; membro lê o próprio; leitor não lê de outro', async () => {
    await assertSucceeds(getDoc(doc(admin(), `lojas/${LOJA}/membros/uid-editor`)))
    await assertSucceeds(getDoc(doc(leitor(), `lojas/${LOJA}/membros/uid-leitor`)))
    await assertFails(getDoc(doc(leitor(), `lojas/${LOJA}/membros/uid-admin`)))
  })
  it('admin cria membro com papel válido; papel inválido falha', async () => {
    await assertSucceeds(setDoc(doc(admin(), `lojas/${LOJA}/membros/novo`), { papel: 'leitor', disabled: false }))
    await assertFails(setDoc(doc(admin(), `lojas/${LOJA}/membros/novo`), { papel: 'super', disabled: false }))
  })
  it('não-admin não escreve membros (sem auto-escalonamento)', async () => {
    await assertFails(setDoc(doc(editor(), `lojas/${LOJA}/membros/uid-editor`), { papel: 'admin', disabled: false }))
  })
  it('ninguém exclui membro (só desativação lógica)', async () => {
    await assertFails(deleteDoc(doc(admin(), `lojas/${LOJA}/membros/uid-leitor`)))
  })
})

describe('roleCounts e auditLogs', () => {
  it('admin lê roleCounts; editor não', async () => {
    await assertSucceeds(getDoc(doc(admin(), `lojas/${LOJA}/system/roleCounts`)))
    await assertFails(getDoc(doc(editor(), `lojas/${LOJA}/system/roleCounts`)))
  })
  it('admin grava roleCounts com admin>=1; admin=0 é bloqueado (piso)', async () => {
    await assertSucceeds(setDoc(doc(admin(), `lojas/${LOJA}/system/roleCounts`), { admin: 1, editor: 0 }))
    await assertFails(setDoc(doc(admin(), `lojas/${LOJA}/system/roleCounts`), { admin: 0, editor: 5 }))
  })
  it('admin lê auditLogs; leitor não; escrita válida ok; adulterar autor falha', async () => {
    await assertSucceeds(getDoc(doc(admin(), `lojas/${LOJA}/auditLogs/log1`)))
    await assertFails(getDoc(doc(leitor(), `lojas/${LOJA}/auditLogs/log1`)))
    await assertSucceeds(
      addDoc(collection(admin(), `lojas/${LOJA}/auditLogs`), {
        targetUid: 'x',
        changedBy: 'uid-admin',
        action: 'update-role',
        timestamp: serverTimestamp(),
      }),
    )
    await assertFails(
      addDoc(collection(admin(), `lojas/${LOJA}/auditLogs`), {
        targetUid: 'x',
        changedBy: 'outro',
        action: 'update-role',
        timestamp: serverTimestamp(),
      }),
    )
  })
})

describe('histórico de itens', () => {
  const ref = () => collection(editor(), `lojas/${LOJA}/itens/item1/historico`)
  it('editor cria com o próprio uid e timestamp do servidor', async () => {
    await assertSucceeds(addDoc(ref(), { acao: 'edicao', usuario: 'uid-editor', timestamp: serverTimestamp() }))
  })
  it('não cria em nome de outro nem pós-datado', async () => {
    await assertFails(addDoc(ref(), { acao: 'edicao', usuario: 'uid-admin', timestamp: serverTimestamp() }))
    await assertFails(addDoc(ref(), { acao: 'edicao', usuario: 'uid-editor', timestamp: Timestamp.fromDate(new Date('2020-01-01')) }))
  })
  it('é imutável', async () => {
    await testEnv.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), `lojas/${LOJA}/itens/item1/historico/ev1`), {
        acao: 'edicao',
        usuario: 'uid-editor',
        timestamp: Timestamp.now(),
      })
    })
    await assertFails(updateDoc(doc(editor(), `lojas/${LOJA}/itens/item1/historico/ev1`), { acao: 'exclusao' }))
    await assertFails(deleteDoc(doc(editor(), `lojas/${LOJA}/itens/item1/historico/ev1`)))
  })
})

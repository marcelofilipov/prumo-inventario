import {
  type Membro,
  type PapelUsuario,
  type RoleCounts,
  planejarCriar,
  planejarDesativar,
  planejarReativar,
  planejarTrocaPapel,
} from '@prumo/core'
import { deleteApp, initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut } from 'firebase/auth'
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { auth, db, firebaseConfig, lojaId } from './firebase'

/**
 * Gestão de membros no modelo doc-based (sem Cloud Functions). Toda escrita é
 * feita pelo próprio client do admin e protegida pelas regras do Firestore
 * (admin escreve; piso de admin>=1 no roleCounts). As funções puras de
 * `@prumo/core` validam os invariantes antes de gravar.
 */

const CONTADORES_INICIAIS: RoleCounts = { admin: 0, editor: 0 }

const refMembro = (uid: string) => doc(db, `lojas/${lojaId}/membros/${uid}`)
const refContadores = () => doc(db, `lojas/${lojaId}/system/roleCounts`)
const refNovoAudit = () => doc(collection(db, `lojas/${lojaId}/auditLogs`))

function uidAtual(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Sessão expirada. Entre novamente.')
  return uid
}

function senhaAleatoria(): string {
  // Descartada: o usuário define a própria senha pelo e-mail de reset.
  return `${crypto.randomUUID()}Aa1!`
}

/**
 * Garante que o contador exista (calculado a partir dos membros ativos).
 * Necessário porque a autorização passou a manter contadores; chame ao abrir
 * a tela de administração, antes das mutações.
 */
export async function inicializarContadoresSeNecessario(membros: Membro[]): Promise<void> {
  if ((await getDoc(refContadores())).exists()) return
  const ativos = membros.filter((m) => !m.disabled)
  await setDoc(refContadores(), {
    admin: ativos.filter((m) => m.papel === 'admin').length,
    editor: ativos.filter((m) => m.papel === 'editor').length,
  })
}

/**
 * Cria a conta em um app secundário (não derruba a sessão do admin) e envia um
 * e-mail para o usuário definir a própria senha; depois grava membro +
 * contador + auditoria em transação.
 */
export async function criarMembro(input: {
  email: string
  displayName?: string
  papel: PapelUsuario
}): Promise<{ uid: string }> {
  const changedBy = uidAtual()
  const email = input.email

  const secApp = initializeApp(firebaseConfig, `criar-membro-${Date.now()}`)
  const secAuth = getAuth(secApp)
  let uid: string
  try {
    uid = (await createUserWithEmailAndPassword(secAuth, email, senhaAleatoria())).user.uid
    await signOut(secAuth)
  } finally {
    await deleteApp(secApp)
  }

  await sendPasswordResetEmail(auth, email)

  await runTransaction(db, async (tx) => {
    const counts = (await tx.get(refContadores())).data() as RoleCounts | undefined
    const agora = Timestamp.now()
    tx.set(refMembro(uid), {
      email,
      displayName: input.displayName ?? '',
      papel: input.papel,
      disabled: false,
      criadoEm: agora,
      atualizadoEm: agora,
    })
    tx.set(refContadores(), planejarCriar(input.papel, counts ?? CONTADORES_INICIAIS))
    tx.set(refNovoAudit(), {
      targetUid: uid,
      changedBy,
      previousRole: null,
      newRole: input.papel,
      action: 'create',
      timestamp: serverTimestamp(),
    })
  })

  return { uid }
}

export async function atualizarPapelMembro(input: { uid: string; novoPapel: PapelUsuario }): Promise<void> {
  const changedBy = uidAtual()
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(refMembro(input.uid))
    if (!snap.exists()) throw new Error('Membro não encontrado.')
    const m = snap.data() as { papel: PapelUsuario; disabled?: boolean }
    if (m.papel === input.novoPapel) return
    const counts = ((await tx.get(refContadores())).data() as RoleCounts | undefined) ?? CONTADORES_INICIAIS
    const plano = planejarTrocaPapel({ previousRole: m.papel, newRole: input.novoPapel, ativo: !m.disabled, counts })
    if (!plano.ok) throw new Error(plano.erro)
    const agora = Timestamp.now()
    tx.update(refMembro(input.uid), { papel: input.novoPapel, atualizadoEm: agora })
    tx.set(refContadores(), plano.valor)
    tx.set(refNovoAudit(), {
      targetUid: input.uid,
      changedBy,
      previousRole: m.papel,
      newRole: input.novoPapel,
      action: 'update-role',
      timestamp: serverTimestamp(),
    })
  })
}

export async function desativarMembro(uid: string): Promise<void> {
  const changedBy = uidAtual()
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(refMembro(uid))
    if (!snap.exists()) throw new Error('Membro não encontrado.')
    const m = snap.data() as { papel: PapelUsuario; disabled?: boolean }
    if (m.disabled) return
    const counts = ((await tx.get(refContadores())).data() as RoleCounts | undefined) ?? CONTADORES_INICIAIS
    const plano = planejarDesativar(m.papel, counts)
    if (!plano.ok) throw new Error(plano.erro)
    const agora = Timestamp.now()
    tx.update(refMembro(uid), { disabled: true, atualizadoEm: agora })
    tx.set(refContadores(), plano.valor)
    tx.set(refNovoAudit(), {
      targetUid: uid,
      changedBy,
      previousRole: m.papel,
      newRole: m.papel,
      action: 'disable',
      timestamp: serverTimestamp(),
    })
  })
}

export async function reativarMembro(uid: string): Promise<void> {
  const changedBy = uidAtual()
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(refMembro(uid))
    if (!snap.exists()) throw new Error('Membro não encontrado.')
    const m = snap.data() as { papel: PapelUsuario; disabled?: boolean }
    if (!m.disabled) return
    const counts = ((await tx.get(refContadores())).data() as RoleCounts | undefined) ?? CONTADORES_INICIAIS
    const agora = Timestamp.now()
    tx.update(refMembro(uid), { disabled: false, atualizadoEm: agora })
    tx.set(refContadores(), planejarReativar(m.papel, counts))
    tx.set(refNovoAudit(), {
      targetUid: uid,
      changedBy,
      previousRole: m.papel,
      newRole: m.papel,
      action: 'enable',
      timestamp: serverTimestamp(),
    })
  })
}

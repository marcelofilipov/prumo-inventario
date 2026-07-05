#!/usr/bin/env node
/**
 * Importa itens do relatório legado (PDF exportado do sistema ASP.NET) para
 * o Firestore, em lojas/{lojaId}/itens.
 *
 * Uso:
 *   node scripts/import-inventario.mjs <caminho-do-pdf>              (dry-run, não grava nada)
 *   node scripts/import-inventario.mjs <caminho-do-pdf> --commit     (grava de verdade)
 *
 * Idempotente: itens cujo codigoLegado já existe na loja são pulados, então
 * pode rodar de novo com uma exportação mais completa sem duplicar.
 *
 * Autenticação: reaproveita o token do `firebase login` já feito no ambiente
 * (via ~/.config/configstore/firebase-tools.json), que tem escopo
 * cloud-platform e por isso grava direto via API REST do Firestore sem
 * passar pelas regras de segurança do app (equivalente ao Admin SDK).
 */
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const PDF_PATH = process.argv[2]
const COMMIT = process.argv.includes('--commit')
const PROJECT_ID = 'prumo-inventario'
const LOJA_ID = 'joao-ramalho-107'
const CRIADO_POR = 'importacao-legado'

if (!PDF_PATH) {
  console.error('Uso: node scripts/import-inventario.mjs <caminho-do-pdf> [--commit]')
  process.exit(1)
}

// --- 1. Extração de texto do PDF -------------------------------------------

const texto = execFileSync('pdftotext', ['-layout', PDF_PATH, '-'], {
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024,
})

// --- 2. Parsing das linhas ---------------------------------------------------

const LINHA_IGNORADA =
  /^(Descrição|Filtros da Consulta|ARLS João Ramalho|Consulta - Invent|Observação|Adquiridos no per|Página \d|Total de Registros|https?:\/\/|\d{2}\/\d{2}\/\d{4},)/

function paraDataISO(dataBr) {
  const [dia, mes, ano] = dataBr.split('/').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia)).toISOString()
}

function parseLinha(linhaBruta) {
  const linha = linhaBruta.trim()
  if (!linha || LINHA_IGNORADA.test(linha)) return null

  let m = linha.match(/^(.*\S)\s+(\d+)\s+(\d{3,6})\s+(\d{2}\/\d{2}\/\d{4})\s*$/)
  if (m) {
    const [, descricao, qtde, codigo, data] = m
    return {
      descricao,
      quantidade: Number(qtde),
      codigoLegado: codigo,
      dataAquisicaoISO: paraDataISO(data),
      incompleto: false,
    }
  }

  m = linha.match(/^(.*\S)\s+(\d+)\s+(\d{3,6})\s*$/)
  if (m) {
    const [, descricao, qtde, codigo] = m
    return { descricao, quantidade: Number(qtde), codigoLegado: codigo, dataAquisicaoISO: null, incompleto: false }
  }

  m = linha.match(/^(.*\S)\s+(\d+)\s*$/)
  if (m) {
    const [, descricao, qtde] = m
    // Provavelmente sem código cadastrado no sistema legado.
    return { descricao, quantidade: Number(qtde), codigoLegado: null, dataAquisicaoISO: null, incompleto: true }
  }

  return null
}

const itens = []
const incompletos = []
for (const linha of texto.split('\n')) {
  const item = parseLinha(linha)
  if (!item) continue
  if (item.incompleto) incompletos.push(item)
  else itens.push(item)
}

// O código legado NÃO é garantidamente único no sistema original — alguns
// itens diferentes acabaram com o mesmo código por erro de digitação de
// quem cadastrou (ex.: 6061 usado tanto para um Datashow quanto para um
// estabilizador). Por isso a chave de deduplicação é (código + descrição),
// não só o código: isso remove linhas genuinamente repetidas (ex.: mesma
// linha capturada duas vezes por sobreposição de páginas) sem descartar
// itens distintos que só coincidem no código.
const codigosComDescricoesDiferentes = new Map()
for (const item of itens) {
  const set = codigosComDescricoesDiferentes.get(item.codigoLegado) ?? new Set()
  set.add(item.descricao)
  codigosComDescricoesDiferentes.set(item.codigoLegado, set)
}
const codigosDuplicadosNoOriginal = [...codigosComDescricoesDiferentes.entries()].filter(([, descs]) => descs.size > 1)

const vistos = new Set()
const itensUnicos = itens.filter((item) => {
  const chave = `${item.codigoLegado}::${item.descricao}`
  if (vistos.has(chave)) return false
  vistos.add(chave)
  return true
})

// --- 3. Inferência de categoria por palavra-chave ----------------------------

const REGRAS_CATEGORIA = [
  {
    categoria: 'ritualistico',
    palavras: [
      'JOIA', 'JÓIA', 'COLAR', 'SÍMBOLO', 'SIMBOLO', 'MAÇ', 'MAC', 'ESQUADRO', 'COMPASSO', 'VENERÁVEL', 'TEMPLO',
      'PRUMO', 'MALHETE', 'BALAUSTRE', 'BASTÃO', 'BASTAO', 'BÍBLIA', 'BIBLIA', 'OFÍCIO', 'OFICIO',
    ],
  },
  {
    categoria: 'acessibilidade_saude',
    palavras: ['MEDICAMENTO', 'FARMÁCIA', 'FARMACIA', 'CADEIRA DE BANHO', 'CADEIRA DE RODAS', 'ANDADOR', 'MULETA'],
  },
  {
    categoria: 'eletronicos',
    palavras: [
      'APARELHO DE SOM', 'AMPLIFICADOR', 'AR CONDICIONADO', 'TELEVIS', ' TV ', 'COMPUTADOR', 'IMPRESSORA',
      'PROJETOR', 'DATASHOW', 'MICROFONE', 'CAIXA DE SOM', 'RÁDIO', 'RADIO', 'GELADEIRA', 'FREEZER',
      'MICRO-ONDAS', 'MICROONDAS', 'VENTILADOR', 'BEBEDOURO',
    ],
  },
  {
    categoria: 'comemorativo',
    palavras: ['COMEMORATIVO', 'ANIVERSÁRIO', 'ANIVERSARIO', 'TROFÉU', 'TROFEU', 'MEDALHA', 'HOMENAGEM'],
  },
  {
    categoria: 'cozinha',
    palavras: [
      'ASSADEIRA', 'PANELA', 'BACIA', 'TALHER', 'GARFO', 'FACA', 'COLHER', 'PRATO', 'COPO', 'XÍCARA', 'XICARA',
      'FOGÃO', 'FOGAO', 'LIQUIDIFICADOR', 'FORMA', 'BANDEJA', 'JARRA', 'TIGELA', 'FRIGIDEIRA', 'AVENTAL',
      'COZINHA', 'AMASSADOR', 'ABRIDOR', 'AMOLADOR', 'BAIXELA',
    ],
  },
  {
    categoria: 'mobiliario',
    palavras: [
      'ARMARIO', 'ARMÁRIO', 'MESA', 'CADEIRA', 'ESTANTE', 'PRATELEIRA', 'SOFÁ', 'SOFA', 'POLTRONA', 'BALCÃO',
      'BALCAO', 'BANCO', 'BANQUETA',
    ],
  },
]

function inferirCategoria(descricao) {
  const texto = ` ${descricao.toUpperCase()} `
  for (const regra of REGRAS_CATEGORIA) {
    if (regra.palavras.some((palavra) => texto.includes(palavra))) return regra.categoria
  }
  return 'outros'
}

const itensProntos = itensUnicos.map((item) => ({ ...item, categoria: inferirCategoria(item.descricao) }))

// --- 4. Relatório do que foi entendido do arquivo ----------------------------

console.log(`Linhas de item reconhecidas: ${itensUnicos.length}`)

if (codigosDuplicadosNoOriginal.length > 0) {
  console.log(
    `\nAviso: ${codigosDuplicadosNoOriginal.length} código(s) do sistema legado estão associados a mais de uma descrição (provável erro de digitação na origem). Todos os itens foram importados mesmo assim, com o codigoLegado repetido:`,
  )
  for (const [codigo, descs] of codigosDuplicadosNoOriginal) {
    console.log(`  - código ${codigo}: ${[...descs].join(' / ')}`)
  }
}

if (incompletos.length > 0) {
  console.log(`\nItens SEM código no arquivo original (não serão importados, revisar manualmente):`)
  for (const item of incompletos) {
    console.log(`  - "${item.descricao}" (qtde ${item.quantidade})`)
  }
}

const porCategoria = {}
for (const item of itensProntos) {
  porCategoria[item.categoria] = (porCategoria[item.categoria] ?? 0) + 1
}
console.log('\nDistribuição por categoria (inferida por palavra-chave):')
for (const [categoria, qtd] of Object.entries(porCategoria).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${categoria.padEnd(22)} ${qtd}`)
}

// --- 5. Autenticação (reaproveita o token do firebase login) ----------------

function obterAccessToken() {
  execFileSync('firebase', ['projects:list', '-P', PROJECT_ID], { stdio: 'ignore' })
  const configPath = path.join(homedir(), '.config/configstore/firebase-tools.json')
  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  return config.tokens.access_token
}

async function buscarChavesExistentes(token) {
  const resp = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/lojas/${LOJA_ID}/itens?pageSize=1000`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  const data = await resp.json()
  const chaves = new Set()
  for (const doc of data.documents ?? []) {
    const codigo = doc.fields?.codigoLegado?.stringValue
    const descricao = doc.fields?.descricao?.stringValue
    if (codigo && descricao) chaves.add(`${codigo}::${descricao}`)
  }
  return chaves
}

function paraFirestoreFields(item, agoraISO) {
  const fields = {
    lojaId: { stringValue: LOJA_ID },
    descricao: { stringValue: item.descricao },
    quantidade: { integerValue: String(item.quantidade) },
    codigoLegado: { stringValue: item.codigoLegado },
    categoria: { stringValue: item.categoria },
    status: { stringValue: 'ativo' },
    fotos: { arrayValue: {} },
    criadoPor: { stringValue: CRIADO_POR },
    atualizadoPor: { stringValue: CRIADO_POR },
    criadoEm: { timestampValue: agoraISO },
    atualizadoEm: { timestampValue: agoraISO },
  }
  if (item.dataAquisicaoISO) {
    fields.dataAquisicao = { timestampValue: item.dataAquisicaoISO }
  }
  return fields
}

// --- 6. Dry-run ou gravação real ---------------------------------------------

if (!COMMIT) {
  console.log('\n[dry-run] Nada foi gravado. Rode novamente com --commit para importar de verdade.')
  process.exit(0)
}

const token = obterAccessToken()
console.log('\nConsultando itens já existentes na loja (para não duplicar)...')
const chavesExistentes = await buscarChavesExistentes(token)
console.log(`Itens já existentes: ${chavesExistentes.size}`)

const novos = itensProntos.filter((item) => !chavesExistentes.has(`${item.codigoLegado}::${item.descricao}`))
const jaExistiam = itensProntos.length - novos.length
console.log(`Novos a criar: ${novos.length} | já existiam (pulados): ${jaExistiam}`)

const agoraISO = new Date().toISOString()
let criados = 0
let falhas = 0
for (const item of novos) {
  const resp = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/lojas/${LOJA_ID}/itens`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: paraFirestoreFields(item, agoraISO) }),
    },
  )
  if (resp.ok) {
    criados++
  } else {
    falhas++
    console.error(`Falha ao criar "${item.descricao}" (${item.codigoLegado}): ${resp.status} ${await resp.text()}`)
  }
}

console.log(`\nConcluído: ${criados} itens criados, ${falhas} falhas.`)

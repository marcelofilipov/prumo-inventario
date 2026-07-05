# @prumo/security-rules

Testes automatizados das regras de segurança do Firestore
(`firestore.rules`), rodando contra o **Firebase Emulator Suite**.

## O que é o Emulator Suite (rápido)

O Emulator Suite é uma versão local dos serviços do Firebase (Firestore,
Auth, Storage...) que roda na sua máquina, **sem tocar em produção e sem
custo**. Para testar regras, ele sobe um Firestore local, carrega o
`firestore.rules` e responde às operações exatamente como o Firestore real
responderia — permitindo ou negando conforme a regra.

Os testes usam a biblioteca oficial `@firebase/rules-unit-testing`, que:

- Cria "contextos" de usuário — autenticado com um `uid` (e, portanto, um
  papel, conforme o membro semeado) ou anônimo.
- Oferece `assertSucceeds(promise)` e `assertFails(promise)` para afirmar que
  uma operação foi **permitida** ou **negada** pelas regras.
- Permite semear dados **ignorando as regras** (`withSecurityRulesDisabled`),
  usado só para preparar o cenário — nunca para a asserção em si.

Cada teste segue o padrão: _dado um usuário com tal papel, quando ele tenta
tal operação, então ela deve suceder/falhar_.

## Como rodar

Pré-requisitos: **Java 21+** (o emulador do Firestore roda em JVM e o
Firebase CLI 15+ exige JDK 21 ou superior) e o **Firebase CLI**
(`firebase-tools`), além do `pnpm install` já feito.

Na raiz do monorepo:

```bash
pnpm test:rules
```

Esse comando usa `firebase emulators:exec`, que **sobe o emulador do
Firestore, roda os testes (Vitest) e derruba o emulador ao final** — tudo em
um passo. Usa o projeto fictício `demo-prumo` (o prefixo `demo-` diz ao
emulador que é offline, sem precisar de credenciais).

Para desenvolver as regras com re-execução automática, deixe o emulador
aberto em um terminal (`firebase emulators:start --only firestore`) e rode
`pnpm --filter @prumo/security-rules test:rules:watch` em outro.

## Cobertura atual

- Leitura de itens: membro sim; não-membro, anônimo e outra loja não
  (isolamento multi-tenant).
- Escrita de itens: papel (editor/admin) + validação de forma (tipos, enum de
  `status`/`categoria`, `lojaId` consistente, `dataAquisicao` null aceito).
- Membros: só admin escreve, `papel` restrito ao enum, sem auto-escalonamento.
- Histórico/auditoria: autor = usuário autenticado, timestamp do servidor,
  imutável após criado.

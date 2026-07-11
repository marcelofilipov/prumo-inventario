# Controle de acesso (RBAC)

Três papéis **por Loja**: `admin` (gerencia usuários + itens), `editor` (CRUD de
itens) e `leitor` (só leitura). Multi-tenant: um usuário pode ter papéis
diferentes em Lojas diferentes (um doc de membro por Loja).

## Fonte da verdade: documento de membro

A autorização vem do documento `lojas/{lojaId}/membros/{uid}`:

```jsonc
{ "email": "...", "displayName": "...", "papel": "admin|editor|leitor",
  "disabled": false, "criadoEm": <ts>, "atualizadoEm": <ts> }
```

- As **Security Rules** leem `get(membros/{uid}).data.papel` e `.disabled`.
- O **frontend** (`auth-context`) escuta esse doc via `onSnapshot` — então mudar
  o papel ou desativar reflete **ao vivo** na sessão do usuário, sem refresh de
  token.
- Membro com `disabled: true` (ou sem doc) fica **sem acesso**.

> Por que não custom claims? Claims só podem ser setados pelo Admin SDK, que
> exige um servidor (Cloud Functions = plano Blaze). O projeto roda no plano
> **Spark (grátis)**, então a autorização é por documento — padrão legítimo e
> suficiente para um app interno de baixo tráfego.

## Gestão de usuários: client-side, sem Cloud Functions

Toda escrita é feita pelo próprio client do **admin**, protegida pelas regras
(`packages/data`/`apps/web/src/lib/membros-admin.ts`):

| Ação | Como |
|---|---|
| Criar usuário | Cria a conta num **app Firebase secundário** (não derruba a sessão do admin), envia `sendPasswordResetEmail` (o usuário define a própria senha) e grava membro + contador + auditoria em transação. |
| Trocar papel | `runTransaction`: valida contadores e grava doc + roleCounts + auditLog. |
| Desativar / Reativar | `runTransaction`: `disabled` lógico, ajusta contador e auditoria. |

O admin **nunca** define a senha de terceiros — o onboarding é por e-mail de
redefinição (grátis no Spark; em produção é um e-mail real).

### Invariantes

- **≥1 admin ativo por Loja**: garantido nas **regras** (o doc
  `lojas/{lojaId}/system/roleCounts` não aceita `admin < 1`) e também no client
  (`@prumo/core/rbac`, testado). Cobre "não remover o último admin", inclusive
  auto-rebaixamento.
- **≥1 editor ativo**: guarda **client-side** apenas (bloqueia remover o último
  editor quando existe um). Não é enforçado nas regras de propósito — o piloto
  hoje tem 0 editores, e um piso rígido travaria a operação.
- Sem escrita otimista: papel/estado só refletem após a confirmação.

A lógica de decisão (contadores/guardas) está isolada em `packages/core/src/rbac.ts`
e testada em `packages/core/test/rbac.test.ts` (sem emulador).

### Limitação conhecida

Como só admins escrevem `membros`/`roleCounts` e o app sempre atualiza os dois
juntos, o piso de admin é confiável na prática. As regras não conseguem, porém,
verificar que a mudança de papel e o contador foram consistentes na mesma
operação (cross-document) — aceitável para um app interno com admins confiáveis.
Se um dia precisar de garantia transacional estrita, migra-se a gestão para um
servidor com Admin SDK (Cloud Functions no Blaze, ou serviço externo).

## Bootstrap

Não há passo especial: basta existir um doc `lojas/{lojaId}/membros/{uid}` com
`papel: "admin"` (criado no console para o primeiro admin — o piloto já tem).
Os contadores são inicializados automaticamente pela tela de administração na
primeira abertura.

## Testar

- **Regras** (`@prumo/security-rules`): `pnpm test:rules` (emulador Firestore,
  JDK 21+). Cobre autorização por doc, desativado sem acesso, isolamento
  multi-tenant, membros/roleCounts/auditLogs e imutabilidade do histórico.
- **Lógica de contadores** (`@prumo/core`): `pnpm --filter @prumo/core test`.
- **Emulador local**: `firebase emulators:start --only auth,firestore` +
  `VITE_USE_EMULATORS=true` no `apps/web/.env.local`.

## Deploy (Spark)

Só regras — sem functions:

```bash
firebase deploy --only firestore:rules
```

O app pode ser servido normalmente (`firebase deploy --only hosting` após o
build). Nada exige o plano Blaze.

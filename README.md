# Prumo

Controle de inventário/patrimônio para Lojas Maçônicas. Piloto: **ARLS
João Ramalho nº 107**.

Contexto completo, modelo de dados e guardrails do projeto estão em
[`PROMPT.md`](./PROMPT.md).

## Links

- **Repositório GitHub**: https://github.com/marcelofilipov/prumo-inventario
- **Firebase Console**: https://console.firebase.google.com/project/prumo-inventario
- **Dev local**: http://localhost:5183 (`pnpm dev` em `apps/web`)

## Stack

- Vite + React 19 + TypeScript strict
- Tailwind CSS v4 (tokens de cor via CSS custom properties, dark/light mode via `next-themes`)
- Componentes no estilo shadcn/ui (Button, Input, Card, Table, Badge...), adaptados para elementos HTML nativos — sem `@base-ui/react`
- React Router v7
- Firebase SDK 11 (Auth + Firestore; Storage ainda não habilitado)
- Monorepo: pnpm workspaces + Turborepo

## Estrutura do monorepo

```
apps/
  web/      React + TypeScript + Vite — aplicação atual
  mobile/   reservado para um futuro app React Native
packages/
  core/     tipos, schemas (zod), contratos de acesso a dados (InventoryRepository,
            MembroRepository), labels e regras de permissão — sem dependência de
            DOM ou de plataforma
  data/     implementação do acesso a dados para o web, usando o Firebase JS SDK
            (Firestore, Auth, Storage)
```

## Requisitos

- Node.js 20+
- pnpm 9 (via `corepack enable && corepack prepare pnpm@9 --activate`)
- Firebase CLI (`npm i -g firebase-tools`) para rodar os emuladores e
  fazer deploy das regras/hosting

## Primeiros passos

```bash
pnpm install
cp .env.example apps/web/.env.local   # preencher com as credenciais do projeto Firebase
pnpm dev
```

Para rodar os emuladores do Firebase (Auth, Firestore, Storage) localmente:

```bash
firebase emulators:start
```

## Bootstrap do primeiro usuário admin

O login funciona (Firebase Auth e-mail/senha), mas o acesso aos dados só
é liberado depois de existir um documento em
`lojas/{lojaId}/membros/{uid}` com `papel: "admin"` — ver seção de
segurança do `PROMPT.md`. Passos:

1. Firebase Console → Authentication → Users → **Add user**.
2. Copiar o UID gerado.
3. Firestore Database → criar `lojas/joao-ramalho-107/membros/{uid}` com
   campo `papel` (string) = `admin`.

## Importação do inventário legado

`scripts/import-inventario.mjs` importa os itens a partir de um PDF
exportado do sistema legado (ASP.NET). Roda em modo dry-run por padrão;
só grava com `--commit`. É idempotente (por `codigoLegado` + `descrição`)
e infere a categoria de cada item por palavra-chave na descrição.

```bash
node scripts/import-inventario.mjs "/caminho/para/Inventario.pdf"           # dry-run
node scripts/import-inventario.mjs "/caminho/para/Inventario.pdf" --commit  # grava de verdade
```

## Status

- [x] Estrutura do monorepo (pnpm + Turborepo)
- [x] Projeto Firebase criado (Firestore + Auth); Storage ainda não habilitado (sem fotos no v1)
- [x] `firestore.rules` deny-by-default, multi-tenant por `lojaId`, papéis admin/editor/leitor
- [x] Autenticação (login e-mail/senha) + rota protegida
- [x] CRUD de itens do inventário (listar com filtros, criar, editar, excluir)
- [x] Design system (Tailwind v4 + dark/light mode), baseado no walletix-backoffice
- [x] Importação dos 579 itens do inventário legado (578 importados; 1 sem código original, cadastro manual pendente)
- [x] Reclassificação de categoria de todos os itens (não só os importados por palavra-chave)
- [ ] Habilitar Storage + upload de fotos por item
- [ ] Log de auditoria (histórico de alterações por item)
- [ ] Deploy do `apps/web` (Firebase Hosting)
- [ ] App mobile (React Native) — reaproveitando `@prumo/core`

## Documentação do Projeto

Notas de arquitetura e decisões técnicas também são mantidas no Obsidian
(`Projects/Prumo`) — ver `Architecture.md` e `Changelog.md` lá para o
histórico detalhado de decisões.

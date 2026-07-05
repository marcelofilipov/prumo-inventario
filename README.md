# Prumo

Controle de inventário/patrimônio para Lojas Maçônicas. Piloto: **ARLS
João Ramalho nº 107**.

[![Licença: AGPL v3](https://img.shields.io/badge/Licen%C3%A7a-AGPL%20v3-blue.svg)](./LICENSE)

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

A partir do primeiro admin, os demais usuários são gerenciados **pela própria
tela _Usuários_ do app** (criar, trocar papel, desativar/reativar) — não mais
manualmente no console. Ver [`docs/rbac.md`](./docs/rbac.md).

## Status

- [x] Estrutura do monorepo (pnpm + Turborepo)
- [x] Projeto Firebase criado (Firestore + Auth); Storage ainda não habilitado (sem fotos no v1)
- [x] `firestore.rules` deny-by-default, multi-tenant por `lojaId`, papéis admin/editor/leitor, com validação de forma dos itens
- [x] Testes das regras de segurança no Firebase Emulator Suite (`pnpm test:rules`)
- [x] Autenticação (login e-mail/senha) + rota protegida
- [x] CRUD de itens do inventário (listar com filtros, criar, editar, excluir)
- [x] Paginação por cursor + cache (TanStack Query) na listagem — ver [`docs/paginacao-itens.md`](./docs/paginacao-itens.md)
- [x] RBAC com gestão de usuários no app (tela Usuários: criar, trocar papel, desativar) — ver [`docs/rbac.md`](./docs/rbac.md)
- [x] Design system (Tailwind v4 + dark/light mode), baseado no walletix-backoffice
- [x] Importação dos 579 itens do inventário legado (578 importados; 1 sem código original, cadastro manual pendente)
- [x] Reclassificação de categoria de todos os itens (não só os importados por palavra-chave)
- [x] Open source: licença AGPL-3.0 + arquivos de comunidade
- [ ] Habilitar Storage + upload de fotos por item
- [ ] Log de auditoria por item (histórico de alterações de cada item)
- [ ] Busca textual server-side (Algolia/Typesense) — [issue #2](https://github.com/marcelofilipov/prumo-inventario/issues/2)
- [ ] Deploy do `apps/web` (Firebase Hosting)
- [ ] App mobile (React Native) — reaproveitando `@prumo/core`

## Documentação do Projeto

- [`docs/rbac.md`](./docs/rbac.md) — controle de acesso (papéis, regras, gestão de usuários)
- [`docs/paginacao-itens.md`](./docs/paginacao-itens.md) — paginação por cursor, cache e índices

Notas de arquitetura e decisões técnicas também são mantidas no Obsidian
(`Projects/Prumo`) — ver `Architecture.md` e `Changelog.md` lá para o
histórico detalhado de decisões.

## Como contribuir

Veja o [`CONTRIBUTING.md`](./CONTRIBUTING.md) para o fluxo de branches, padrões
de código e checklist de PR. Ao participar, você concorda com o
[Código de Conduta](./CODE_OF_CONDUCT.md). Para relatar vulnerabilidades, siga
o [`SECURITY.md`](./SECURITY.md).

## Licença

Distribuído sob a licença **GNU Affero General Public License v3.0** — ver
[`LICENSE`](./LICENSE). A AGPL-3.0 é copyleft e cobre uso em rede: se você rodar
uma versão modificada como serviço, precisa disponibilizar o código-fonte
correspondente aos usuários.

© 2026 Marcelo Filipov.

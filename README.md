# Prumo

Controle de inventário/patrimônio para Lojas Maçônicas. Piloto: **ARLS
João Ramalho nº 107**.

Contexto completo, modelo de dados e guardrails do projeto estão em
[`PROMPT.md`](./PROMPT.md).

## Estrutura do monorepo

```
apps/
  web/      React + TypeScript + Vite — aplicação atual
  mobile/   reservado para um futuro app React Native
packages/
  core/     tipos, schemas (zod) e contratos de acesso a dados, sem
            dependência de DOM ou de plataforma
  data/     implementação do acesso a dados para o web, usando o
            Firebase JS SDK (Firestore, Storage)
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

## Status

Estrutura inicial do monorepo. Ainda faltam: criação do projeto Firebase,
autenticação, CRUD de itens na UI, importação dos dados legados
(`Inventário2026.pdf`, 579 itens) e testes das regras de segurança via
Emulator Suite — ver seção 8 do `PROMPT.md`.

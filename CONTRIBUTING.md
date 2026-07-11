# Contribuindo com o Prumo

Obrigado pelo interesse em contribuir! Este guia resume o fluxo de trabalho e
as convenções do projeto.

## Antes de começar

- Procure uma [issue](https://github.com/marcelofilipov/prumo-inventario/issues)
  aberta ou abra uma descrevendo o que pretende fazer, para evitar trabalho
  duplicado.
- Para mudanças grandes, comente na issue e alinhe a abordagem antes de codar.

## Ambiente de desenvolvimento

Requisitos: Node.js 20+, pnpm 9 (`corepack enable`) e Firebase CLI.

```bash
pnpm install
cp .env.example apps/web/.env.local   # preencher com suas credenciais Firebase
pnpm dev
```

Você precisa de um projeto Firebase próprio (Auth + Firestore) para rodar
localmente — o projeto do piloto não é compartilhado. Os emuladores ajudam:
`firebase emulators:start`.

## Fluxo de branches

- A branch de integração é **`develop`** (não `main`).
- Crie sua branch a partir de `develop`:
  `git checkout develop && git pull && git checkout -b feat/minha-mudanca`.
- Prefixos: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`.
- Toda alteração entra em `develop` **via Pull Request** — não faça push
  direto.

## Antes de abrir o PR

Rode a verificação completa do monorepo e garanta que passa:

```bash
pnpm typecheck   # tsc -b em todos os pacotes
pnpm lint        # oxlint
pnpm build       # build de produção
```

- Mantenha a tipagem estrita — evite `any`.
- Respeite a separação de camadas: lógica de negócio em `packages/core`
  (sem dependência de plataforma), acesso a dados em `packages/data`, UI em
  `apps/web`. Não misture regra de negócio dentro de componentes.
- Comente decisões não óbvias, seguindo a densidade de comentários do código
  ao redor.

## Pull Request

- Descreva **o quê** e **por quê**, e como testou.
- Referencie a issue relacionada (`Closes #123`).
- PRs pequenos e focados são revisados mais rápido.

## Reportando bugs e segurança

- Bugs comuns: abra uma issue com passos para reproduzir.
- **Vulnerabilidades de segurança: não abra issue pública** — siga o
  [`SECURITY.md`](./SECURITY.md).

## Licença

Ao contribuir, você concorda que sua contribuição será licenciada sob a
[AGPL-3.0](./LICENSE), a mesma licença do projeto.

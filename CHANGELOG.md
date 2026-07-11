# Changelog

Todas as mudanças relevantes deste projeto são registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e o projeto adota o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado

- Estrutura do monorepo (pnpm workspaces + Turborepo): `apps/web` (Vite + React
  + TypeScript), `apps/mobile` reservado, `packages/core` (tipos, schemas Zod e
  contratos de acesso a dados) e `packages/data` (implementação Firestore/Auth
  para web).
- Autenticação via Firebase Auth (e-mail/senha) com rota protegida.
- CRUD de itens do inventário: listagem com filtros (descrição, código,
  observação, período de aquisição), criação/edição (formulário validado com
  Zod) e exclusão com confirmação; ações restritas a admin/editor.
- **Paginação por cursor + cache** na listagem de itens com TanStack Query
  (`useInfiniteQuery`, scroll infinito, refino de filtro client-side,
  `staleTime` curto + invalidação nas mutações). Ver
  [`docs/paginacao-itens.md`](./docs/paginacao-itens.md).
- **Controle de acesso (RBAC)** por papéis (`admin`/`editor`/`leitor`) por Loja,
  com autorização baseada no documento `lojas/{lojaId}/membros/{uid}`
  (`papel` + `disabled`) e papel refletido ao vivo no frontend via `onSnapshot`.
- **Gestão de usuários no app** (tela `/admin/usuarios`, só admin): criar
  usuário (com e-mail de definição de senha), trocar papel, desativar/reativar;
  contadores (`system/roleCounts`) e auditoria (`auditLogs`) por Loja. Modelo
  doc-based, sem Cloud Functions. Ver [`docs/rbac.md`](./docs/rbac.md).
- Suíte de **testes das regras de segurança** no Firebase Emulator Suite
  (`packages/security-rules`, com `@firebase/rules-unit-testing`).
- Design system com Tailwind CSS v4 e dark/light mode (`next-themes`).
- Importação dos 579 itens do inventário legado (578 importados; 1 sem código de
  origem, pendente de cadastro manual).
- Documentação técnica em `docs/` (`rbac.md`, `paginacao-itens.md`).
- Licenciamento **open source** sob AGPL-3.0 e arquivos de comunidade
  (`CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`).
- Deploy do `apps/web` no **Firebase Hosting**, em produção em
  <https://prumo-inventario.web.app>.

### Alterado

- Reclassificação de categoria de todos os itens do inventário por análise da
  descrição (292 itens movidos de "outros" para categorias específicas).

### Corrigido

- Falha silenciosa ao salvar item com campos opcionais em branco — o Firestore
  rejeita `undefined`; resolvido com `initializeFirestore(app, { ignoreUndefinedProperties: true })`.
- Regras de segurança negando o acesso quando o documento de membro é legado e
  não tem o campo `disabled` — tratado com `.get('disabled', false)`, com teste
  de regressão.
- `site` do Firebase Hosting apontava para `prumo-joao-ramalho-107`
  (inexistente no projeto), fazendo `firebase deploy --only hosting` falhar com
  `could not find site`; corrigido para `prumo-inventario`.

### Removido

- Script de importação one-off do inventário legado
  (`scripts/import-inventario.mjs`), após cumprir o papel.

### Segurança

- Endurecimento das `firestore.rules`: validação de forma dos itens no servidor
  (tipos, enums, `lojaId` consistente), histórico de itens imutável e piso de
  `admin >= 1` nos contadores de papéis.

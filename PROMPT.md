# Prompt de Especificação — Projeto "Prumo"

> Sistema de Controle de Inventário/Patrimônio para Lojas Maçônicas.
> Piloto: ARLS João Ramalho nº 107 (Santo André). Arquitetura pensada para,
> no futuro, atender múltiplas Lojas.

Copie este documento inteiro como prompt inicial para o agente/assistente
que vai implementar o projeto (Claude Code, Cursor, etc.). Ele contém
contexto, arquitetura, modelo de dados e guardrails — não é só uma lista de
features.

---

## 1. Contexto

Estamos construindo o **Prumo**, um sistema web (e futuramente app mobile)
de controle de inventário/patrimônio para Lojas Maçônicas. O primeiro
cliente/piloto é a **ARLS João Ramalho nº 107**, que hoje controla ~579
itens de patrimônio (mobiliário, utensílios de cozinha, eletrônicos, itens
ritualísticos, equipamentos de acessibilidade/saúde, itens comemorativos
etc.) em um sistema legado ASP.NET simples (tela "Consulta - Inventário").

O nome "Prumo" foi escolhido deliberadamente **sem vínculo com o nome de
uma Loja específica**, pois o objetivo de médio prazo é oferecer o mesmo
produto para outras Lojas.

## 2. Objetivo do produto

Substituir a planilha/sistema legado por um sistema web moderno que:

- Cadastra, consulta, filtra e edita itens de patrimônio.
- Permite anexar fotos e observações a cada item.
- Mantém histórico/auditoria de alterações (quem mudou o quê e quando).
- Gera relatórios/exportações (PDF/CSV) equivalentes ao sistema atual.
- É multi-tenant *by design* (isolado por Loja), mesmo que o v1 sirva
  apenas a ARLS João Ramalho nº 107.
- Compartilha o máximo possível de lógica/infra com um futuro app Android
  em React Native, usando o mesmo backend Firebase.

## 3. Stack e arquitetura (monorepo)

- **Gerenciador de monorepo:** Turborepo (ou Nx, se o agente preferir —
  justificar a escolha) + pnpm workspaces.
- **apps/web** — React + TypeScript + Vite. UI própria da web (não
  compartilhada com o mobile).
- **apps/mobile** — reservado para o futuro (React Native + TypeScript).
  **Não implementar agora** — apenas garantir que a estrutura de pacotes
  compartilhados já sirva a ele sem retrabalho.
- **packages/core** — regras de negócio e tipos compartilhados
  (TypeScript puro, sem dependência de DOM ou de React Native), schemas de
  validação (ex.: Zod), constantes de categorias, funções de mapeamento do
  código legado.
- **packages/data** — camada de acesso a dados (Firestore/Storage),
  consumida tanto por `apps/web` quanto (futuramente) por `apps/mobile`.
  Nenhuma lógica de UI aqui.
- **Backend:** Firebase — Firestore (dados), Firebase Auth (login),
  Firebase Storage (fotos dos itens), Firebase Hosting (deploy do web),
  Cloud Functions apenas se necessário (ex.: geração de relatório
  pesado, auditoria server-side). Não usar Cloud Functions só por usar.
- **Não compartilhar componentes de UI entre web e mobile** — só lógica,
  tipos e acesso a dados. Tentar compartilhar UI entre React web e React
  Native sem uma lib tipo Tamagui/NativeWind é fonte de complexidade
  desnecessária para este projeto.

## 4. Modelo de dados (Firestore)

Estrutura pensada para multi-tenant desde o início:

```
lojas/{lojaId}
  nome: string
  criadoEm: timestamp

lojas/{lojaId}/itens/{itemId}
  descricao: string
  quantidade: number
  codigoLegado: string        // ex.: "4002" — preservar para rastreabilidade
  categoria: string           // ver seção 4.1
  localizacao?: string        // ex.: "Cozinha", "Templo", "Salão de Banquetes"
  observacao?: string
  dataAquisicao?: timestamp
  valorEstimado?: number
  status: "ativo" | "baixado" | "emprestado" | "manutencao"
  fotos: string[]             // URLs do Firebase Storage
  criadoPor: uid
  criadoEm: timestamp
  atualizadoPor: uid
  atualizadoEm: timestamp

lojas/{lojaId}/itens/{itemId}/historico/{eventoId}   // auditoria
  acao: "criacao" | "edicao" | "exclusao"
  campo?: string
  valorAnterior?: any
  valorNovo?: any
  usuario: uid
  timestamp: timestamp

lojas/{lojaId}/membros/{uid}
  papel: "admin" | "editor" | "leitor"
```

### 4.1 Categorias a partir do código legado

O sistema atual usa um código numérico com prefixo por faixa (ex.: `3xxx`
itens de acessibilidade/saúde, `4xxx` mobiliário/utensílios gerais, `5xxx`
utensílios de cozinha/assadeiras, `6xxx` itens comemorativos/especiais,
`7xxx` itens ritualísticos, `8xxx` eletrodomésticos/eletrônicos) — **essa
inferência foi feita a partir de uma amostra pequena (primeira página de
12) do PDF `Inventário2026.pdf`, que tem 579 itens ao todo.**

**Guardrail:** antes de finalizar o mapeamento `prefixo → categoria`, o
agente deve extrair todas as 12 páginas / 579 linhas do PDF e **confirmar
com o usuário** a lista de prefixos e nomes de categoria — não assumir
que a amostra da página 1 cobre todos os prefixos existentes.

## 5. Papéis e permissões

Manter simples e genérico (para servir a qualquer Loja no futuro), não
usar nomenclatura específica de cargo maçônico como papel de sistema:

- `admin` — CRUD completo, gerencia usuários e papéis da Loja.
- `editor` — CRUD de itens, sem gerenciar usuários.
- `leitor` — apenas consulta/exportação.

Regras de segurança do Firestore devem **negar por padrão** e liberar
explicitamente por papel e por `lojaId` (nunca leitura/escrita global).

## 6. Escopo do MVP (v1)

Incluir:
- CRUD de itens com os campos da seção 4.
- Busca/filtro por descrição, código legado, observação e período de
  aquisição (equivalente à tela atual).
- Upload de fotos por item.
- Exportação de lista (CSV e/ou PDF).
- Dashboard simples: total de itens, itens por categoria, itens por
  status.
- Login (Firebase Auth, e-mail/senha) e controle de papéis.
- Log de auditoria por item.
- Script de importação dos 579 itens do PDF/sistema legado para o
  Firestore, em modo *dry-run* revisável antes de gravar em produção.

Fora de escopo do v1 (não implementar sem pedir):
- App mobile em si (só preparar a estrutura do monorepo).
- Módulos financeiros, de frequência ou de cadastro de membros da Loja.
- Multi-idioma (interface é pt-BR apenas).
- Onboarding self-service para outras Lojas (fica para quando houver
  demanda real — hoje só isolar os dados já é suficiente).

## 7. Guardrails gerais

- **Segurança:** nunca deixar Firestore/Storage com regras abertas
  (`allow read, write: if true`). Toda regra deve exigir autenticação +
  checar `lojaId` + papel do usuário.
- **Credenciais:** nunca commitar chaves/config do Firebase em texto
  puro no repositório; usar variáveis de ambiente e `.env` no
  `.gitignore`.
- **LGPD:** o inventário de patrimônio não deve armazenar dados pessoais
  de membros além do estritamente necessário (ex.: `uid` de quem
  cadastrou). Se no futuro houver cadastro de membros, tratar como
  domínio separado e mais sensível.
- **Multi-tenant desde o início:** toda leitura/escrita de item deve
  passar pelo `lojaId`, mesmo havendo só uma Loja hoje — evita migração
  dolorosa depois.
- **Migração de dados:** o script de import deve ser revisável (dry-run
  com relatório do que seria criado) antes de gravar em produção, e deve
  preservar o `codigoLegado` para auditoria/rastreabilidade.
- **Sem over-engineering:** não construir o app React Native agora, não
  criar abstrações de UI compartilhada "só por garantia", não adicionar
  Cloud Functions sem uma necessidade concreta.
- **Acessibilidade:** parte do público é de idade mais avançada — bom
  contraste, fontes legíveis, poucos cliques para tarefas comuns.
- **Testes de regra de segurança:** usar o Firebase Emulator Suite para
  testar as regras do Firestore/Storage antes de qualquer deploy.
- **Idioma da interface:** pt-BR em toda a UI, mensagens de erro e
  e-mails transacionais.
- Antes de tomar decisões estruturais não cobertas aqui (ex.: nome do
  projeto Firebase, domínio, provedor de deploy do web), **perguntar ao
  usuário** em vez de assumir.

## 8. Entregáveis esperados da primeira iteração

1. Estrutura do monorepo (`apps/web`, `packages/core`, `packages/data`)
   funcionando com Turborepo + pnpm.
2. Projeto Firebase criado (ou instruções para o usuário criar) com
   Firestore, Auth e Storage configurados, e regras de segurança
   versionadas no repo (`firestore.rules`, `storage.rules`).
3. Tela de login e CRUD básico de itens no `apps/web`.
4. Script de extração/importação dos dados do
   `Inventário2026.pdf` para Firestore, em modo dry-run.
5. Testes das regras de segurança via Emulator Suite.

---

*Domínio/nome de produto sugerido: **Prumo**. Ajustar `lojaId` inicial
para representar a ARLS João Ramalho nº 107 (ex.: slug
`joao-ramalho-107`).*

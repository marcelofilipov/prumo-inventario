# Paginação e cache da listagem de itens (`/itens`)

## Índices compostos no Firestore

**Nesta versão, nenhum índice composto é necessário.**

A paginação usa `orderBy('descricao')` **sem** cláusula `where` — os filtros
(descrição, observação, código, faixa de data) são refino _client-side_ sobre
as páginas já carregadas, porque o Firestore não faz busca por substring. Uma
query com um único `orderBy` e nenhum `where` é atendida pelo índice de campo
único de `descricao`, que o Firestore mantém automaticamente. Por isso
`firestore.indexes.json` permanece com `"indexes": []`.

### Evolução futura (só se os filtros forem para o servidor)

Se um dia os filtros de código/data passarem a ser aplicados no Firestore
(combinados com `orderBy('descricao')`), aí sim serão necessários índices
compostos. Deixo prontos para colar em `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "itens",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "codigoLegado", "order": "ASCENDING" },
        { "fieldPath": "descricao", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "itens",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "dataAquisicao", "order": "ASCENDING" },
        { "fieldPath": "descricao", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

> Observação: uma faixa (`>=`/`<=`) em `dataAquisicao` exige que o **primeiro**
> `orderBy` seja `dataAquisicao` — o que muda a ordem de exibição. Combinar
> faixa de data com ordenação alfabética por descrição não é suportado pelo
> Firestore em uma única query; nesse caso a busca textual deveria migrar para
> um serviço de índice (Algolia/Typesense).

## Trade-off do `staleTime` (10s)

Quantidade em estoque é dado **operacional e crítico**, não catálogo estático.
`staleTime: 10_000` significa que, dentro de 10s, navegações repetidas para
`/itens` servem do cache em memória (zero leitura no Firestore); passados os
10s, a próxima montagem/foco revalida em segundo plano — com aviso visual
"Atualizando…" para não passar dado velho como atual.

- **Menor** (ex.: 0–2s): dado mais fresco, mais leituras/custo, mais chance de
  ver spinner ao voltar para a lista.
- **Maior** (ex.: minutos): barato, mas arrisca exibir quantidade defasada —
  inaceitável para este domínio.

10–15s equilibra: barato o suficiente para navegação normal, curto o
suficiente para não mascarar mudanças de estoque. **Independente do
`staleTime`, toda mutação (criar/editar/excluir) invalida `['itens']` e força
revalidação imediata** — o `staleTime` nunca é a única defesa da atualidade.

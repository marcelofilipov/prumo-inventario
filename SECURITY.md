# Política de Segurança

## Reportando uma vulnerabilidade

**Não abra uma issue pública para vulnerabilidades de segurança.** Como este
projeto lida com dados de inventário e de membros, a divulgação responsável é
importante.

Prefira um dos canais privados:

1. **GitHub Security Advisories** (recomendado): aba **Security** →
   **Report a vulnerability** neste repositório. Isso mantém o relato privado
   até a correção.
2. **E-mail**: marcelo.filipov@gmail.com com o assunto `[SECURITY] Prumo`.

Inclua, se possível:

- Descrição da vulnerabilidade e do impacto.
- Passos para reproduzir (ou prova de conceito).
- Versão/commit afetado.

## O que esperar

- Confirmação de recebimento em até **72 horas**.
- Avaliação e, quando aplicável, correção priorizada.
- Crédito ao pesquisador na divulgação, se desejado.

## Escopo

Atenção especial a:

- Regras do Firestore/Storage (`firestore.rules`, `storage.rules`) —
  isolamento multi-tenant por `lojaId` e papéis `admin`/`editor`/`leitor`.
- Autenticação e autorização.
- Exposição de dados de membros (LGPD).

Configuração local mal ajustada (ex.: credenciais fracas no seu próprio
projeto Firebase) está fora do escopo.

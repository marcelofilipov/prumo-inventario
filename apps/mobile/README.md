# apps/mobile (reservado)

Ainda não implementado — fica para uma fase futura, quando houver demanda
pelo app Android.

Quando for iniciado:

- Stack: React Native + TypeScript.
- Reaproveitar `@prumo/core` (tipos, schemas, contrato `InventoryRepository`).
- **Não** reaproveitar `@prumo/data` diretamente — aquele pacote usa o
  Firebase JS SDK, pensado para o ambiente web. O app mobile deve usar
  `@react-native-firebase` (módulos nativos, mais robusto em RN) e
  implementar uma nova classe que satisfaça a interface
  `InventoryRepository` definida em `@prumo/core` — algo como um futuro
  pacote `@prumo/data-mobile`.
- **Não** reaproveitar componentes de UI do `apps/web` — React Native não
  usa DOM; a UI é feita do zero (React Native ou uma lib tipo NativeWind),
  só a lógica de negócio e os tipos são compartilhados.

Ver `PROMPT.md` na raiz do repositório para o contexto completo do
projeto.

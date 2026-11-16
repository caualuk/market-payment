# Testes

A landing usa **Vitest 5** com **jsdom** e **Testing Library** (React + user-event + jest-dom).

## Como rodar

```bash
cd landing
npm test              # roda tudo uma vez (CI)
npm run test:watch    # modo watch durante o desenvolvimento
npm run coverage      # cobertura (v8) → texto no terminal + HTML em landing/coverage/
npm run typecheck     # checagem de tipos (tsc -b)
npm run lint          # oxlint
```

## Resultado atual

```
Test Files  7 passed (7)
     Tests  95 passed (95)
```

Cobertura (v8), escopo `src/lib`, `src/scene/keyframes.ts` e `src/components`:

| Escopo | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| Total | 88.9% | 90.8% | 91.3% | 90.9% |
| `src/lib` (regras de negócio) | 96.8% | 93.6% | 100% | 98.9% |

A cena 3D (`scene/Scene.tsx`, `screenTexture.ts`) fica fora da cobertura porque depende de WebGL/canvas, que o jsdom não tem. A lógica que decide o que a cena mostra está em `keyframes.ts`, uma função pura testada à parte.

## O que cada suíte cobre

### `src/lib/cart.test.ts`: regras do carrinho (22 testes)
- `addItem`: linha nova, incremento, imutabilidade, limite de 99 unidades.
- `setQty`: alteração, remoção ao chegar a 0 ou valor negativo, arredondamento, `NaN` ignorado.
- Totais em **centavos**: o carrinho das telas do FigCraft (8 itens) soma exatamente **R$ 77,28**.
- `formatBRL`: padrão pt-BR, milhar com ponto e espaço comum (sem NBSP).
- `calcChange`: troco, valor exato e falta de dinheiro.
- `suggestReceived`: "Exato" + próximas notas redondas, sem repetição.
- `createPaymentCode`: formato `000 000`, determinístico com `random` injetado.
- `passWindow` / `secondsToRotate`: rotação do QR a cada 30 s.

### `src/lib/checkout.test.ts`: máquina de estados do fluxo (21 testes)
- Compra: SCAN avança o cursor do catálogo, SCAN com produto explícito, volta no catálogo.
- Checkout bloqueado com carrinho vazio (mensagem de erro, que some ao escanear).
- Pagamento digital (Pix, carteira, cartão) vai direto para `paid`.
- **Dinheiro**: gera código, **trava o carrinho** (SCAN/SET_QTY ignorados), "trocar forma de pagamento" invalida o código, caixa confirma com troco, valor insuficiente mostra "Faltam X reais", troco digital ligado por padrão.
- Transições inválidas são ignoradas (ex.: confirmar caixa fora de `awaiting_cash`).
- `RESET` volta ao estado inicial.

### `src/lib/motion.test.ts`: física de movimento (12 testes)
- `damp` converge sem ultrapassar o alvo e é **independente do frame rate** (60 fps = 30 fps).
- `rubberBand` resiste progressivamente, preserva o sinal e nunca passa da dimensão.
- `projectMomentum` com d = 0.998 (≈ 499 px para 1000 px/s) e d = 0.99.
- `clamp`, `lerp`, `mapRange` (inclusive com intervalo degenerado) e `smoothstep`.

### `src/lib/qr.test.ts`: QR ilustrativo (7 testes)
- Matriz quadrada, determinística por seed, seeds diferentes geram padrões diferentes.
- Três *finders* 7×7 corretos (borda, anel vazio, núcleo) e zona de silêncio.
- Densidade de módulos razoável (entre 25% e 75%).

### `src/scene/keyframes.test.ts`: coreografia 3D (11 testes)
- `howStep` divide o scroll em 4 passos e satura nos extremos.
- `poseFor` retorna números finitos para toda seção, progresso e viewport (desktop/mobile).
- A tela do celular 3D acompanha o passo ativo de "Como funciona".
- Produtos entram no carrinho durante o passo "Escaneie".
- Na seção dinheiro, o QR âmbar vira verde no fim.
- Na demo, o celular 3D sai de cena; no mobile ele fica centralizado e menor.

### `src/components/Demo.test.tsx`: demo interativa, de ponta a ponta (11 testes)
- Estado vazio e bloqueio de checkout sem itens.
- Escanear adiciona itens, mostra o toast e atualiza o total.
- Stepper incrementa, decrementa e remove.
- **Fluxo Pix completo** até o passe verde com timer de rotação.
- **Fluxo dinheiro completo**: código de 6 dígitos, console do caixa com sugestões (Exato / R$ 20 / R$ 50), troco recalculado, confirmação e passe com "Troco na carteira Passa".
- Desligar o troco digital, trocar forma de pagamento, "Nova compra".
- `CashierConsole` isolado: seleção padrão, `onConfirm` com o valor escolhido, exibição de erro.

### `src/components/sections.test.tsx`: página e acessibilidade (11 testes)
- Todas as seções e âncoras da navegação existem.
- Cada seção declara `data-scene` e `data-surface` válidos (contrato com a cena 3D).
- Um único `h1` com nome acessível intacto mesmo após o SplitText.
- **Sem WebGL a página funciona** (o canvas não é montado e a demo continua usável).
- Link "Pular para a demo", menu mobile com `aria-expanded`, passos com `aria-current`.
- FAQ funciona como acordeão (abre, fecha, um por vez, `hidden` no conteúdo).

## Ambiente de teste

[`src/test/setup.ts`](../landing/src/test/setup.ts) adiciona os matchers do jest-dom, limpa o DOM entre testes e cria stubs para APIs que o jsdom não tem: `matchMedia` (GSAP), `IntersectionObserver`, `ResizeObserver`, `scrollTo` e `canvas.getContext`. Com `getContext` retornando `null`, `hasWebGL()` dá falso e a cena 3D não é montada.

## Verificação manual (feita no Chrome)

- Rolagem completa: a cena 3D troca de pose e de tela por seção, e o fundo alterna escuro → claro → quente → escuro.
- "Como funciona": o passo ativo no texto bate com a tela do celular 3D.
- Demo: fluxo dinheiro completo (5 itens → código → caixa → passe verde) sem erros no console.
- Viewport de 390 px: sem rolagem horizontal; menu vira botão.

## Convenções

- Testes ficam ao lado do código (`*.test.ts(x)`).
- Valores monetários sempre em centavos nos testes.
- Aleatoriedade é injetável (`random`), então nenhum teste depende de sorte.
- Consultas por papel e nome acessível (`getByRole`) antes de `data-testid`.

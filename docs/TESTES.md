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
Test Files  9 passed (9)
     Tests  131 passed (131)
```

Cobertura (v8), escopo `src/lib`, `src/scene/story.ts`, `src/scene/cash.ts` e `src/components`:

| Escopo | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| Total | 91.5% | 92.6% | 91.3% | 92.7% |
| `src/lib` (regras de negócio) | 96.8% | 94.4% | 100% | 98.3% |
| `scene/story.ts` e `scene/cash.ts` (roteiros 3D) | 100% | 100% | 100% | 100% |

Os componentes que só desenham em WebGL ou canvas (`StoryScene`, `CashScene`, `models`, `textures`, `screenTexture`) ficam fora da cobertura, porque o jsdom não tem esses recursos. Tudo o que decide **o que** a cena mostra e **quando** está nos roteiros puros, que têm cobertura total.

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

### `src/lib/ean.test.ts`: código de barras EAN-13 (8 testes)
- Dígito verificador (exemplo conhecido `4006381333931`) e validação.
- **Todos os produtos do catálogo têm EAN-13 válido**: são esses códigos que aparecem nos rótulos 3D. Três códigos antigos do catálogo estavam com o verificador errado e foram corrigidos.
- 95 módulos com as guardas (`101 · 01010 · 101`), paridade L/G pelo 1º dígito e conjunto R à direita.
- Recusa desenhar código inválido; identifica peso variável (prefixo 2, balança).

### `src/lib/motion.test.ts`: física de movimento (12 testes)
- `damp` converge sem ultrapassar o alvo e é **independente do frame rate** (60 fps = 30 fps).
- `rubberBand` resiste progressivamente, preserva o sinal e nunca passa da dimensão.
- `projectMomentum` com d = 0.998 (≈ 499 px para 1000 px/s) e d = 0.99.
- `clamp`, `lerp`, `mapRange` (inclusive com intervalo degenerado) e `smoothstep`.

### `src/lib/qr.test.ts`: QR ilustrativo (7 testes)
- Matriz quadrada, determinística por seed, seeds diferentes geram padrões diferentes.
- Três *finders* 7×7 corretos (borda, anel vazio, núcleo) e zona de silêncio.
- Densidade de módulos razoável (entre 25% e 75%).

### `src/scene/story.test.ts`: roteiro 3D da jornada de compra (26 testes)
- **Contexto**: os 5 produtos são os do design, com EAN válido, e o total é R$ 63,39. Os capítulos cobrem 0→1 sem buracos, na ordem hero → check-in → escaneie → pague → saída.
- **Tela do celular** certa em cada capítulo (home, check-in, scanner, pagamento, "Pix aprovado", passe). O letreiro da loja acende no check-in e continua aceso.
- **Escanear e ensacolar**: tudo começa na prateleira e termina na cesta. Os produtos são lidos **um de cada vez, na ordem da gôndola**. Contagem e subtotal do app **nunca diminuem** e batem com o que está na cesta. O item é lido exatamente no ponto do laser, e o laser fica apagado fora das leituras.
- **Saída**: a caminhada até a saída só começa depois do pagamento e é monotônica. A gôndola sai pela esquerda e o balcão entra pela direita, **uma única vez**. O leitor lê o QR antes de liberar, e nada é liberado antes do Pix aprovado.
- **Continuidade (para nada "sair e voltar sem pretexto")**: nenhum objeto anda mais que ~1/3 do próprio tamanho a cada 0,1% de scroll. A velocidade é contínua: dividir o passo pela metade divide o deslocamento, o que detecta saltos. Todos os produtos existem o tempo todo, e o mesmo `t` gera o mesmo quadro (reversível ao rolar para cima).

### `src/scene/cash.test.ts`: roteiro 3D do caixa em dinheiro (8 testes)
- Valores do design: R$ 75,28, nota de R$ 100, troco de R$ 24,72.
- Passos na ordem; o tablet passa por `idle → reading → awaiting → received → released` **sem voltar**.
- O feixe aparece só no passo "leitura"; a nota entra de fora do quadro e pousa deitada no balcão antes do troco.
- A moeda do troco digital só existe enquanto viaja e chega ao celular antes de sumir (é "absorvida" pela carteira).
- O QR do cliente só fica verde depois do dinheiro recebido.

### `src/components/Demo.test.tsx`: demo interativa, de ponta a ponta (11 testes)
- Estado vazio e bloqueio de checkout sem itens.
- Escanear adiciona itens, mostra o toast e atualiza o total.
- Stepper incrementa, decrementa e remove.
- **Fluxo Pix completo** até o passe verde com timer de rotação.
- **Fluxo dinheiro completo**: código de 6 dígitos, console do caixa com sugestões (Exato / R$ 20 / R$ 50), troco recalculado, confirmação e passe com "Troco na carteira Passa".
- Desligar o troco digital, trocar forma de pagamento, "Nova compra".
- `CashierConsole` isolado: seleção padrão, `onConfirm` com o valor escolhido, exibição de erro.

### `src/components/sections.test.tsx`: página, acessibilidade e contrato texto ↔ 3D (16 testes)
- Todas as seções e âncoras da navegação existem, e cada seção tem uma superfície (`dark/light/warm`) válida.
- **As cenas 3D ficam dentro dos blocos que ilustram**; não existe canvas fixo atravessando a página.
- **Cada passo de "Como funciona" cai no capítulo 3D correspondente**, e `storyProgress` liga hero (0→0.2) e passos (0.2→1) sem salto.
- A seção Dinheiro tem um texto por passo da cena do caixa; `<CashFlow />` marca o passo atual.
- Um único `h1` com nome acessível intacto mesmo após o SplitText; **sem WebGL a página funciona**.
- Link "Pular para a demo", menu mobile com `aria-expanded`, passos com `aria-current`, FAQ em acordeão.

## Ambiente de teste

[`src/test/setup.ts`](../landing/src/test/setup.ts) adiciona os matchers do jest-dom, limpa o DOM entre testes e cria stubs para APIs que o jsdom não tem: `matchMedia` (GSAP), `IntersectionObserver`, `ResizeObserver`, `scrollTo` e `canvas.getContext`. Com `getContext` retornando `null`, `hasWebGL()` dá falso e as cenas 3D não são montadas.

## Verificação manual (feita no Chrome, desktop e 390 px)

- **Jornada**: o check-in acende o letreiro. Os 5 produtos passam pelo laser e caem na cesta; no meio da leitura, o app mostra "2 itens · R$ 15,39". Depois aparece "Pix aprovado R$ 63,39". A gôndola fica para trás, o tablet lê o QR, fica verde e a cancela abre.
- **Fim do bloco**: a cena sai de quadro **junto** com "Como funciona". Isso veio de um bug de `sticky` com margem negativa, que deixava a cena sobre a demo; já está corrigido.
- **Dinheiro**: QR âmbar → feixe de leitura → nota de R$ 100 no balcão → moeda do troco indo para o app → passe verde e faixa do balcão verde.
- **Demo**: fluxo dinheiro completo sem erros no console.
- **390 px**: sem rolagem horizontal; a cena fica abaixo do texto e o menu vira botão.

## Convenções

- Testes ficam ao lado do código (`*.test.ts(x)`).
- Valores monetários sempre em centavos nos testes.
- Aleatoriedade é injetável (`random`), então nenhum teste depende de sorte.
- A lógica das cenas é função pura e testada; os componentes 3D só aplicam o quadro calculado.
- Consultas por papel e nome acessível (`getByRole`) antes de `data-testid`.

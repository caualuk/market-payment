# Passa — landing page

Landing do Passa. Duas cenas 3D, guiadas pelo scroll, contam o produto: **a jornada de uma compra** (da gôndola à cancela de saída) e **o pagamento em dinheiro no caixa expresso**. Também há uma demo interativa do fluxo completo.

## Stack

- **React 19 + TypeScript + Vite**
- **GSAP 3** (ScrollTrigger e SplitText) para scroll, revelação de texto e microinterações
- **Three.js** via **React Three Fiber** e **drei**, com modelos procedurais (sem arquivos .glb)
- **Vitest + Testing Library** para os testes (ver [`../docs/TESTES.md`](../docs/TESTES.md))

## Scripts

| Comando | Faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Roda os testes uma vez |
| `npm run test:watch` | Testes em modo watch |
| `npm run coverage` | Cobertura (v8) |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | oxlint |
| `npm run build` | Build de produção (`dist/`) |

## Arquitetura

```
src/
├── App.tsx                  # monta as seções; detecta WebGL
├── hooks/
│   ├── useSurface.ts        # [data-surface] → fundo do <html>; ponteiro; reduced motion
│   └── useInView.ts         # pausa o render 3D fora da tela
├── lib/
│   ├── cart.ts              # carrinho em centavos, troco, código de pagamento, rotação do QR
│   ├── checkout.ts          # máquina de estados: shopping → checkout → (awaiting_cash) → paid
│   ├── ean.ts               # EAN-13 real (verificador + 95 módulos) para os rótulos 3D
│   ├── motion.ts            # damp, rubberBand, projectMomentum, mapRange…
│   ├── qr.ts                # matriz de QR ilustrativa e determinística
│   ├── webgl.ts             # detecção de WebGL
│   └── gsap.ts              # registro dos plugins + prefersReducedMotion
├── scene/
│   ├── story.ts             # roteiro puro da jornada (hero + como funciona): storyFrame(t)
│   ├── cash.ts              # roteiro puro do caixa em dinheiro: cashFrame(p)
│   ├── models.tsx           # embalagens, cesta de arame, gôndola, balcão + tablet + cancela, nota, moeda
│   ├── textures.ts          # rótulos com EAN, etiquetas de preço, letreiro, nota, moeda, telas do tablet
│   ├── screenTexture.ts     # telas do app no celular, com os dados da cena
│   ├── Stage.tsx            # Canvas R3F + iluminação de estúdio
│   ├── StoryScene.tsx       # aplica storyFrame a cada frame
│   ├── CashScene.tsx        # aplica cashFrame a cada frame
│   └── store.ts             # progresso do scroll lido pelo render (sem re-render do React)
└── components/
    ├── Story.tsx            # Hero + Como funciona + cena sticky (uma jornada contínua)
    ├── CashFlow.tsx         # seção Dinheiro sticky com a cena do caixa
    ├── Nav, Hero, HowItWorks, Demo, ForStores, Faq, FinalCta
    └── ui/ Reveal, Magnetic, TiltCard, QrCode   # primitivas de movimento no estilo Skiper UI
```

### Como o scroll controla o 3D

1. `Story` combina o progresso do hero (0→0.2) e o de "Como funciona" (0.2→1) em `sceneStore.story`; `CashFlow` grava `sceneStore.cash`.
2. A cada frame, a cena suaviza esse valor com `damp` e calcula `storyFrame(t)` / `cashFrame(p)`: posição de cada produto, tela do celular, laser, caminhada até a saída, cancela, nota, moeda…
3. Os roteiros são **funções puras**. Rolar para cima desfaz a cena, e os testes verificam a narrativa inteira: ordem dos produtos, contagem do carrinho e continuidade dos movimentos.
4. Cada cena fica `sticky` **dentro do bloco que ilustra** e sai de quadro junto com ele. Nada some no meio da página e volta depois.

Os detalhes de cada capítulo estão em [`../docs/DESIGN.md`](../docs/DESIGN.md#movimento-e-3d-landing).

### Desempenho e acessibilidade

- O Three.js fica num chunk separado (~270 kB gzip), carregado depois do texto; cada cena pausa o render quando sai da tela.
- Sem WebGL, a página funciona inteira sem as cenas.
- Respeita `prefers-reduced-motion`, `prefers-reduced-transparency` e `prefers-contrast`.
- Link "pular para a demo", foco visível e controles com nomes acessíveis; os canvases têm `role="img"` e descrição.

> O QR code da demo é **ilustrativo** (`lib/qr.ts`). No produto real, o passe é um token assinado no servidor. Os códigos de barras, por outro lado, são EAN-13 válidos.

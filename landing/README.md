# Passa — landing page

Landing do Passa com cena 3D guiada pelo scroll e uma demo interativa do fluxo completo, incluindo o pagamento em dinheiro com o console do caixa.

## Stack

- **React 19 + TypeScript + Vite**
- **GSAP 3** (ScrollTrigger e SplitText) para scroll, revelação de texto e microinterações
- **Three.js** via **React Three Fiber** e **drei** para o celular 3D, os produtos e as moedas
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
├── App.tsx                 # monta as seções; carrega a cena 3D sob demanda (lazy) se houver WebGL
├── hooks/useScrollScene.ts # ScrollTrigger → sceneStore (seção + progresso) e data-surface do <html>
├── lib/
│   ├── cart.ts             # regras do carrinho em centavos, troco, código de pagamento, rotação do QR
│   ├── checkout.ts         # máquina de estados: shopping → checkout → (awaiting_cash) → paid
│   ├── motion.ts           # damp, rubberBand, projectMomentum, mapRange…
│   ├── qr.ts               # matriz de QR ilustrativa e determinística
│   └── gsap.ts             # registro dos plugins + prefersReducedMotion
├── scene/
│   ├── keyframes.ts        # poseFor(seção, progresso, mobile): coreografia pura e testável
│   ├── store.ts            # estado mutável lido a cada frame (sem re-render do React)
│   ├── screenTexture.ts    # desenha as telas do app num canvas 2D (textura do celular)
│   └── Scene.tsx           # Canvas R3F: celular, produtos, moedas e iluminação de estúdio
└── components/
    ├── Nav, Hero, HowItWorks, Demo, CashFlow, ForStores, Faq, FinalCta
    └── ui/ Reveal, Magnetic, TiltCard, QrCode   # primitivas de movimento no estilo Skiper UI
```

### Como o scroll controla o 3D

1. Cada seção tem `data-scene="hero|how|demo|cash|stores|cta"`.
2. `useScrollScene` cria um ScrollTrigger por seção e grava `{ section, progress }` no `sceneStore`. A seção "Como funciona" (`data-scene-progress="self"`) publica o próprio progresso para casar texto e 3D.
3. A cada frame, `Scene.tsx` calcula `poseFor(section, progress)` e persegue a pose com `damp` (amortecimento crítico). Assim a animação pode ser interrompida a qualquer momento e nunca "teleporta".

### Desempenho e acessibilidade

- O Three.js fica num chunk separado (~270 kB gzip), carregado depois do texto.
- Sem WebGL, a página funciona inteira sem a cena.
- Respeita `prefers-reduced-motion`, `prefers-reduced-transparency` e `prefers-contrast`.
- Link "pular para a demo", foco visível e controles com nomes acessíveis.

> O QR code da demo é **ilustrativo** (`lib/qr.ts`). No produto real, o passe é um token assinado no servidor.

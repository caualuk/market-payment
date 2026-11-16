# Sistema visual

O design segue as diretrizes de *fluid interfaces* da Apple, compiladas na skill [`apple-design`](https://github.com/emilkowalski/skills/tree/main/skills/apple-design): resposta imediata, animações interrompíveis, molas sem overshoot por padrão, materiais translúcidos e tipografia com tracking negativo em tamanhos grandes.

Arquivo-fonte: [`design/passa-app.figcraft`](../design/passa-app.figcraft) (abre no FigCraft). Exportação: [`design/screens/app-flow.png`](../design/screens/app-flow.png).

## Cores

| Token | Hex | Uso |
|---|---|---|
| Ink | `#0A0A0F` | Texto, botões primários, fundos escuros |
| Surface | `#F5F5F7` | Fundo claro |
| Gray | `#6E6E73` | Texto secundário |
| Primária (gradiente) | `#5E5CE6 → #32D2FF` | Marca, CTA de pagamento, destaques |
| Green | `#30D158` | **Pago / liberado** (passe de saída) |
| Amber | `#FF9F0A` | **Aguardando dinheiro** (código de pagamento) |
| Pink | `#FF375F` | Alertas, "chamar fiscal" |

As cores de estado são a parte mais importante do sistema. O operador identifica de longe se o cliente pagou (verde) ou precisa pagar (âmbar).

## Tipografia

- Família: SF Pro (`-apple-system`) com fallback para **Inter**. Valores e códigos usam **JetBrains Mono**.
- Títulos: peso 700–800, `letter-spacing` de -0.03 a -0.045em, `line-height` de 0.98 a 1.05.
- Corpo: 15–17 px, `line-height` 1.5.
- Valores monetários usam `font-variant-numeric: tabular-nums` para não "pular" quando mudam.

## Materiais

- Vidro: `backdrop-filter: blur(20px) saturate(180%)` com borda de 1 px translúcida (nav, cards, toasts da câmera).
- Raios: 14 / 22 / 32 px, com cantos suavizados (`cornerSmoothing 0.6` no FigCraft).
- Respeita `prefers-reduced-transparency` (fundo sólido) e `prefers-contrast: more` (bordas definidas).

## Movimento (landing)

| Elemento | Técnica |
|---|---|
| Celular 3D + produtos | Three.js (React Three Fiber). A pose-alvo vem do scroll e é perseguida com `damp`, um amortecimento crítico independente do FPS. |
| Coreografia por seção | `scene/keyframes.ts`: cada `[data-scene]` define posição, rotação, tela exibida e comportamento dos produtos |
| Troca de fundo | `[data-surface]` alterna `dark / light / warm` no `<html>` com transição de cor |
| Textos | GSAP SplitText: palavras sobem com blur (estilo Skiper UI *text reveal*) |
| Botões | Magnéticos (`gsap.quickTo`) e `scale(.97)` no pointer-down |
| Cards | Inclinação 3D seguindo o ponteiro com brilho especular |
| "Como funciona" | Bloco `sticky`; o progresso escolhe o passo e a tela do celular 3D |

Com `prefers-reduced-motion`, revelações viram cross-fades, a cena 3D para de flutuar e as transições ficam curtas.

### Coreografia 3D por seção

| Seção | Celular | Tela | Produtos |
|---|---|---|---|
| Hero | Direita, girando com o scroll | Home | Orbitam |
| Como funciona | Direita | check-in → scanner → pagamento → passe | Entram no celular no passo "Escaneie" |
| Demo | Sai de cena | – | Escondidos |
| Dinheiro | Esquerda | QR âmbar → QR verde | Moedas e nota orbitam |
| Lojistas | Centro, uma volta completa | Passe | Anel ao redor |
| CTA final | Centro | Home | Orbitam |

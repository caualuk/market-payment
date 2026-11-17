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


## Movimento e 3D (landing)

### Princípio: o 3D conta a história do produto

Cada objeto 3D existe num mercado de verdade e tem um papel no fluxo. Nada é decorativo:

| Objeto | Por que está ali |
|---|---|
| Gôndola do **Mercado Aurora**, com letreiro e etiquetas de preço amarelas | É onde a compra começa; o letreiro acende no check-in |
| Leite, pão de forma, abacate, café e sabão | Os mesmos 5 itens das telas do FigCraft, com **EAN-13 válido** desenhado no rótulo (o abacate tem a etiqueta de peso variável da balança) |
| Laser verde saindo da câmera do celular | A leitura do código de barras |
| Cesta de arame vermelha | O "carrinho de verdade", que enche junto com o carrinho do app |
| Celular | Mostra na tela exatamente o que acontece na cena (itens lidos, subtotal, Pix aprovado, passe) |
| Balcão de saída com tablet e cancela de vidro | Onde o caixa valida o QR e a saída é liberada |
| Nota de R$ 100 e moeda "+R$ 24,72" | O pagamento em espécie e o troco digital indo para a carteira |

### Regras de coreografia

1. **A cena pertence ao bloco que ilustra.** Não há canvas fixo atravessando a página. A cena da jornada fica `sticky` dentro de *Hero + Como funciona* e sai de quadro junto com esse bloco. A cena do caixa vive dentro da seção *Dinheiro*. Nenhum objeto some numa seção e reaparece em outra.
2. **Tudo que entra ou sai do quadro tem motivo.** A gôndola sai pela esquerda porque "caminhamos" até a saída, e o balcão entra pela direita pelo mesmo motivo. A nota entra pela esquerda porque o cliente a entrega. A moeda nasce no caixa e é absorvida pelo celular.
3. **Função pura do scroll.** `storyFrame(t)` e `cashFrame(p)` não têm estado. Rolar para cima desfaz a compra na ordem inversa (os produtos saem da cesta e voltam para a prateleira).
4. **Texto e 3D andam juntos.** Cada passo do texto corresponde a um capítulo da cena, e há testes que garantem isso.
5. **Suavidade sem atraso perceptível.** O loop de render persegue o `t` do scroll com `damp`, um amortecimento crítico independente de FPS. Não há overshoot e não há "teleporte".

### Roteiro: Hero + Como funciona (`scene/story.ts`)

| t | Capítulo | Na cena | Tela do celular |
|---|---|---|---|
| 0.0–0.2 | Hero | Gôndola com os 5 produtos, cesta vazia, celular | Home |
| 0.2–0.4 | Check-in | O letreiro da loja acende ("check-in feito") | Mercado Aurora ✓ |
| 0.4–0.6 | Escaneie | Um produto por vez sai da prateleira, passa pelo laser e cai na cesta | Scanner com a lista e o subtotal crescendo (R$ 5,49 → R$ 63,39) |
| 0.6–0.8 | Pague | O celular vem para frente com a cesta cheia | Total → "Pix aprovado" |
| 0.8–1.0 | Saída | A gôndola fica para trás e o balcão entra; o tablet lê o QR (feixe azul), fica verde e a cancela abre | Passe de saída verde |

### Roteiro: Dinheiro (`scene/cash.ts`)

| Passo | Na cena | Tablet do caixa | Celular |
|---|---|---|---|
| 1 Código | Celular no balcão | "Pronto para ler" | QR âmbar + 482 913 |
| 2 Leitura | Feixe âmbar do tablet até o QR | "Aguardando dinheiro · R$ 75,28" | QR âmbar |
| 3 Dinheiro | Nota de R$ 100 pousa no balcão; a moeda "+R$ 24,72" voa para o app | "Recebido R$ 100 · Troco → carteira" | QR âmbar |
| 4 Liberado | A faixa do balcão e a cancela ficam verdes | "Saída liberada" ✓ | Passe verde |

### Outras animações

| Elemento | Técnica |
|---|---|
| Troca de fundo | `[data-surface]` alterna `dark / light / warm` no `<html>` com transição de cor |
| Textos | GSAP SplitText: palavras sobem com blur (estilo Skiper UI *text reveal*) |
| Botões | Magnéticos (`gsap.quickTo`) e `scale(.97)` no pointer-down |
| Cards (bento) | Inclinação 3D seguindo o ponteiro com brilho especular |

Com `prefers-reduced-motion`, a cena segue o scroll sem suavização e sem flutuação, e as revelações de texto viram cross-fades. Fora da tela, o loop de render de cada cena pausa (`frameloop="never"`).

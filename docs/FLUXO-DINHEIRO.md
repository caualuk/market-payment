# Fluxo de pagamento em dinheiro

O desafio: quem paga em espécie precisa passar por uma pessoa, mas não deveria **recontar a compra** nem perder as vantagens do app.

## Proposta: "um scan, duas funções"

```
App do cliente                        Caixa expresso (tablet/celular)
───────────────                       ───────────────────────────────
Carrinho fechado
  │ escolhe "Dinheiro no caixa"
  ▼
Código de pagamento ──── mostra ────▶ Escaneia QR (ou digita 6 dígitos)
  QR âmbar + "482 913"                  │ vê itens e total
  carrinho travado                      │ recebe o dinheiro
  troco digital: on/off                 │ toca no valor entregue → troco calculado
  │                                     ▼
  │◀──────── confirmação em tempo real ── "Confirmar e liberar"
  ▼
QR fica verde (passe de saída) ─▶ saída liberada no mesmo balcão
```

### Passo a passo

1. **Cliente escolhe "Dinheiro no caixa".** O app gera um *código de pagamento*: um QR âmbar e 6 dígitos ligados ao pedido, com o total congelado.
   - O carrinho **trava** para edição enquanto o código estiver ativo, para que o total cobrado no caixa seja o mesmo do app.
   - O botão "Trocar forma de pagamento" cancela o código e volta ao checkout.
2. **Caixa expresso.** O operador escaneia o QR ou digita o código. A tela do caixa (tela 07 do design) mostra o pedido, o total e botões de valor recebido (exato e as próximas notas redondas, ex.: R$ 75,28 → *Exato · R$ 80 · R$ 100*). O troco é calculado na hora.
3. **Confirmação.** Ao tocar em "Confirmar e liberar", o QR do cliente fica **verde em tempo real**. Como pagamento e validação acontecem no mesmo balcão, a saída já está liberada.

### Troco digital

O cliente pode receber o troco como **crédito na carteira Passa** (vem ligado por padrão). Isso resolve a falta de moedas no caixa, reduz manuseio de dinheiro e incentiva o cliente a voltar. A tela do operador avisa claramente: *"Não entregue troco em espécie"*.

## Por que esse desenho

| Alternativa | Problema |
|---|---|
| Cliente passa tudo de novo no caixa comum | Perde todo o ganho de tempo e cria fila |
| Pagar em dinheiro numa máquina (cash recycler) | Hardware caro, nem toda loja tem |
| Só aceitar pagamento digital | Exclui uma parcela relevante do público de mercados |
| **Código de pagamento + caixa expresso** | Sem hardware novo, sem recontagem, operador só confere o valor |

## Antifraude (vale para todos os métodos)

- **QR dinâmico**: assinado no servidor, renova a cada 30 s (`passWindow`) e é de uso único. Um print de tela não funciona.
- **Expiração**: o código de dinheiro expira em 20 min sem pagamento.
- **Conferência por amostragem**: o sistema sorteia pedidos para conferir e sinaliza ao operador (tela 07). A taxa pode subir com o perfil de risco.
- **Checagem de peso da sacola**: opcional por loja.

## Onde está no código

- Máquina de estados: [`landing/src/lib/checkout.ts`](../landing/src/lib/checkout.ts) (`PAY_CASH`, `CHANGE_METHOD`, `CASHIER_CONFIRM`, `TOGGLE_DIGITAL_CHANGE`)
- Regras de troco e sugestões de valor: [`landing/src/lib/cart.ts`](../landing/src/lib/cart.ts) (`calcChange`, `suggestReceived`, `createPaymentCode`)
- Demo interativa com o console do caixa: [`landing/src/components/Demo.tsx`](../landing/src/components/Demo.tsx)
- Testes: [`checkout.test.ts`](../landing/src/lib/checkout.test.ts) e [`Demo.test.tsx`](../landing/src/components/Demo.test.tsx)

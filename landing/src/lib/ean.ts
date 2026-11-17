/**
 * Codificação EAN-13 de verdade — o mesmo padrão que o app lê na câmera.
 * Usado para desenhar códigos de barras válidos nas embalagens 3D da landing.
 */

const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011']
const R = L.map((c) => [...c].map((b) => (b === '1' ? '0' : '1')).join(''))
const G = R.map((c) => [...c].reverse().join(''))
/** Paridade dos 6 dígitos da esquerda conforme o primeiro dígito. */
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL']

/** Dígito verificador para os 12 primeiros dígitos. */
export function ean13CheckDigit(first12: string): number {
  if (!/^\d{12}$/.test(first12)) throw new Error('EAN-13: esperado 12 dígitos')
  const sum = [...first12].reduce((s, d, i) => s + Number(d) * (i % 2 === 0 ? 1 : 3), 0)
  return (10 - (sum % 10)) % 10
}

export function isValidEan13(code: string): boolean {
  return /^\d{13}$/.test(code) && ean13CheckDigit(code.slice(0, 12)) === Number(code[12])
}

/** Completa 12 dígitos com o verificador. */
export function withCheckDigit(first12: string): string {
  return first12 + ean13CheckDigit(first12)
}

/**
 * Sequência de 95 módulos ('1' = barra, '0' = espaço):
 * guarda 101 · 6 dígitos (L/G) · guarda central 01010 · 6 dígitos (R) · guarda 101.
 */
export function ean13Modules(code: string): string {
  if (!isValidEan13(code)) throw new Error(`EAN-13 inválido: ${code}`)
  const d = [...code].map(Number)
  const parity = PARITY[d[0]]
  let out = '101'
  for (let i = 1; i <= 6; i++) out += parity[i - 1] === 'L' ? L[d[i]] : G[d[i]]
  out += '01010'
  for (let i = 7; i <= 12; i++) out += R[d[i]]
  return out + '101'
}

/** Varejo brasileiro: prefixo 2 = produto de peso variável (balança da loja). */
export function isVariableWeight(code: string): boolean {
  return code.startsWith('2')
}

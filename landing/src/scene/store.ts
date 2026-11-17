/**
 * Estado mutável compartilhado entre o DOM (ScrollTrigger, ponteiro) e os
 * loops de render do Three.js. Lido a cada frame em `useFrame`, por isso é um
 * objeto simples e não estado React (evita re-renders a 60 fps).
 */
export const sceneStore = {
  /** progresso do roteiro Hero + Como funciona (0→1), ver `story.ts` */
  story: 0,
  /** progresso da seção Dinheiro (0→1), ver `cash.ts` */
  cash: 0,
  /** ponteiro normalizado em [-1, 1] */
  pointerX: 0,
  pointerY: 0,
  reducedMotion: false,
}

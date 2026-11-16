import type { SectionId } from './keyframes'

/**
 * Estado mutável compartilhado entre o DOM (ScrollTrigger, ponteiro) e o loop
 * de render do Three.js. É lido a cada frame em `useFrame`, por isso é um
 * objeto simples e não estado React (evita re-renders a 60 fps).
 */
export const sceneStore = {
  section: 'hero' as SectionId,
  progress: 0,
  /** Ponteiro normalizado em [-1, 1]. */
  pointerX: 0,
  pointerY: 0,
  reducedMotion: false,
}

export function setSection(section: SectionId, progress: number) {
  sceneStore.section = section
  sceneStore.progress = progress
}

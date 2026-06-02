export const motionEase = [0.22, 1, 0.36, 1] as const

export const quickTransition = {
  duration: 0.18,
  ease: motionEase,
}

export const navTransition = {
  duration: 0.22,
  ease: motionEase,
}

export function getScreenMotion(reducedMotion: boolean) {
  return {
    initial: reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 },
    animate: reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
    exit: reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 },
    transition: reducedMotion ? { duration: 0.01 } : quickTransition,
  }
}

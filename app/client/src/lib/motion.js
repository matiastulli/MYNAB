// Shared motion vocabulary. Springs only - no linear easing on interactive UI.

export const spring = { type: "spring", stiffness: 100, damping: 20 }
export const snappy = { type: "spring", stiffness: 380, damping: 32 }

export const listParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
}

export const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: spring },
}

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: spring,
}

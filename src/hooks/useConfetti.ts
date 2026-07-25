import confetti from 'canvas-confetti'
import { useCallback } from 'react'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function prefersReducedMotion(): boolean {
  return window.matchMedia?.(REDUCED_MOTION).matches ?? false
}

export function useConfetti() {
  /** A quick burst from a point on screen — used at the tap location. */
  const burst = useCallback((x = 0.5, y = 0.6, color?: string) => {
    if (prefersReducedMotion()) return
    confetti({
      particleCount: 45,
      spread: 60,
      startVelocity: 32,
      scalar: 0.85,
      ticks: 120,
      origin: { x, y },
      ...(color ? { colors: [color, '#ffc800', '#ffffff'] } : {}),
    })
  }, [])

  /** The bigger moment: a level-up or a new badge. */
  const celebrate = useCallback(() => {
    if (prefersReducedMotion()) return
    const shoot = (originX: number) =>
      confetti({
        particleCount: 70,
        spread: 75,
        startVelocity: 45,
        origin: { x: originX, y: 0.7 },
        colors: ['#58cc02', '#1cb0f6', '#ffc800', '#ce82ff', '#ff4b4b'],
      })
    shoot(0.25)
    setTimeout(() => shoot(0.75), 120)
    setTimeout(() => shoot(0.5), 240)
  }, [])

  return { burst, celebrate }
}

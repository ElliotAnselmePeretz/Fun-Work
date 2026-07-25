import { useCallback, useState } from 'react'
import { useConfetti } from '../../hooks/useConfetti'
import { useUiStore } from '../../store/useUiStore'
import { logSession } from './logActions'

/**
 * Wraps the log write with its feedback: a confetti burst at the tap point, a
 * floating XP number, and any level-up or badge celebration queued for the
 * modal. Components get one `log()` call and don't orchestrate any of it.
 */
export function useLogSession() {
  const { burst, celebrate } = useConfetti()
  const enqueueBadges = useUiStore((state) => state.enqueueBadges)
  const setLevelUp = useUiStore((state) => state.setLevelUp)
  const [popupToken, setPopupToken] = useState<number | null>(null)
  const [pending, setPending] = useState(false)

  const log = useCallback(
    async (activityId: string, event?: { clientX: number; clientY: number }, color?: string) => {
      if (pending) return
      setPending(true)
      try {
        const result = await logSession(activityId)

        setPopupToken(Date.now())
        const x = event ? event.clientX / window.innerWidth : 0.5
        const y = event ? event.clientY / window.innerHeight : 0.6
        burst(x, y, color)

        if (result.levelCleared || result.newBadges.length > 0) {
          celebrate()
          if (result.levelCleared) setLevelUp(result.levelCleared)
          if (result.newBadges.length > 0) enqueueBadges(result.newBadges)
        }
        return result
      } finally {
        setPending(false)
      }
    },
    [burst, celebrate, enqueueBadges, pending, setLevelUp],
  )

  return { log, popupToken, pending }
}

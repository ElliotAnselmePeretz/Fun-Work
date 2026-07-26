import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { useUiStore } from '../../store/useUiStore'
import { PixelIcon } from '../../components/PixelIcon'
import { badgeIcon } from './badgeIcon'

/**
 * The single celebration surface. Level-ups and badges both funnel into the
 * queue in useUiStore, so several things earned in one tap show as one moment
 * instead of a stack of competing popups.
 */
export function CelebrationModal() {
  const badgeQueue = useUiStore((state) => state.badgeQueue)
  const levelUpMessage = useUiStore((state) => state.levelUpMessage)
  const dismiss = useUiStore((state) => state.dismissCelebration)

  const open = badgeQueue.length > 0 || levelUpMessage !== null
  if (!open) return null

  return (
    <Modal open onClose={dismiss} bare>
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        {levelUpMessage && (
          <>
            <PixelIcon name="crystal" className="animate-pop-in h-16 w-16" />
            <div>
              <h2 className="text-2xl font-extrabold text-grass">Level up!</h2>
              <p className="mt-1 font-bold text-ink-soft">
                You cleared <span className="text-ink">{levelUpMessage}</span>
              </p>
            </div>
          </>
        )}

        {badgeQueue.length > 0 && (
          <div className="w-full">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
              {badgeQueue.length === 1 ? 'New badge' : `${badgeQueue.length} new badges`}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {badgeQueue.map((badge) => (
                <div
                  key={badge.id}
                  className="animate-pop-in flex w-28 flex-col items-center gap-1 rounded-2xl border-2 border-gold/50 bg-gold/10 p-3"
                >
                  <PixelIcon name={badgeIcon(badge.kind)} className="h-11 w-11" />
                  <span className="text-xs font-extrabold leading-tight">
                    {badge.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button size="lg" onClick={dismiss} className="mt-2">
          Nice!
        </Button>
      </div>
    </Modal>
  )
}

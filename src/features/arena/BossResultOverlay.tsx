import { useEffect, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { GameIcon } from '../../components/GameIcon'
import { PixelIcon } from '../../components/PixelIcon'
import type { Boss } from '../../lib/bosses'

export type BossResultKind = 'victory' | 'defeat'

interface BossResultOverlayProps {
  kind: BossResultKind
  boss: Boss
  coinReward: number
  attemptNumber: number
  onDismiss: () => void
}

/**
 * A deliberately cinematic result screen. It owns no combat state: the result
 * still comes entirely from the replayed boss ledger, and this disappears as
 * soon as the player dismisses it.
 */
export function BossResultOverlay({
  kind,
  boss,
  coinReward,
  attemptNumber,
  onDismiss,
}: BossResultOverlayProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') onDismiss()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onDismiss])

  const victory = kind === 'victory'

  return createPortal(
    <div
      className={`boss-result-overlay boss-result-${kind}`}
      style={{ '--boss-accent': boss.accent } as CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-labelledby="boss-result-title"
      aria-describedby="boss-result-description"
    >
      <div className="boss-result-vignette" aria-hidden />
      <div className="boss-result-particles" aria-hidden>
        {Array.from({ length: 12 }, (_, index) => (
          <i
            key={index}
            style={{
              left: `${4 + index * 8.2}%`,
              top: `${12 + ((index * 37) % 72)}%`,
              animationDelay: `${index * -0.31}s`,
            }}
          />
        ))}
      </div>

      <div className="boss-result-content">
        {victory ? (
          <>
            <div className="boss-trophy-head" aria-hidden>
              <span className="boss-trophy-crown">
                <GameIcon name="crown" size={24} strokeWidth={2.6} />
              </span>
              <img src={boss.art} alt="" className="pixel-art" />
            </div>
            <p className="boss-result-kicker">Bounty claimed</p>
            <h2 id="boss-result-title" className="boss-victory-title">
              Boss defeated
            </h2>
            <p id="boss-result-description" className="boss-result-name">
              You defeated <strong>{boss.name}</strong>
            </p>
            <div className="boss-result-reward">
              <PixelIcon name="coin" className="h-7 w-7" />
              <span>+{coinReward.toLocaleString()}</span>
              <small>coins</small>
            </div>
            <button
              type="button"
              className="boss-result-button"
              onClick={onDismiss}
              autoFocus
            >
              Claim victory
              <GameIcon name="trophy" size={19} />
            </button>
          </>
        ) : (
          <>
            <img
              src={boss.art}
              alt=""
              className="boss-result-defeat-art pixel-art"
              aria-hidden
            />
            <p className="boss-result-kicker">Attempt {attemptNumber}</p>
            <div className="boss-wasted-rule" aria-hidden />
            <h2 id="boss-result-title" className="boss-wasted-title">
              Wasted
            </h2>
            <div className="boss-wasted-rule" aria-hidden />
            <p id="boss-result-description" className="boss-result-name">
              You were defeated by <strong>{boss.name}</strong>
            </p>
            <p className="boss-result-mercy">
              Your coins and equipment are safe. Read the attack pattern and
              return stronger.
            </p>
            <button
              type="button"
              className="boss-result-button"
              onClick={onDismiss}
              autoFocus
            >
              Rise again
              <GameIcon name="swords" size={19} />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

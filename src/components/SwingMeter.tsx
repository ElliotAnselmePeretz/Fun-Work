import { useEffect, useRef } from 'react'
import type { StrikeTiming } from '../lib/bosses'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

/** One full sweep out and back, in milliseconds. */
const PERIOD = 1600

/**
 * Half-widths of the scoring bands, as a share of the track. The perfect band
 * is narrow enough to be a real ask and wide enough to be reachable on a phone.
 */
const PERFECT = 0.055
const GOOD = 0.2

/** Where the marker is right now, as 0 → 1 → 0 over one period. */
function positionAt(elapsed: number): number {
  const phase = (elapsed % PERIOD) / PERIOD
  return phase < 0.5 ? phase * 2 : 2 - phase * 2
}

function timingAt(position: number): StrikeTiming {
  const offset = Math.abs(position - 0.5)
  if (offset <= PERFECT) return 'perfect'
  if (offset <= GOOD) return 'good'
  return 'weak'
}

export interface SwingMeterHandle {
  /** The timing to score the strike that is being taken right now. */
  read: () => StrikeTiming
}

interface SwingMeterProps {
  /** Stops the sweep between turns and while a turn is resolving. */
  running: boolean
  handle: React.MutableRefObject<SwingMeterHandle | null>
  accent: string
  /** The last result, held on the track so the player can see what they hit. */
  result?: StrikeTiming
}

/**
 * The arena's timing bar. A marker sweeps the track and the Strike button reads
 * wherever it happens to be, so a turn is a small act of skill rather than a
 * click.
 *
 * Under `prefers-reduced-motion` nothing sweeps: the track shows a fixed marker
 * in the centre and always reads `good`, the 1.0 multiplier the whole balance
 * table is built around. Nobody is excluded, and nobody is penalised for it.
 */
export function SwingMeter({ running, handle, accent, result }: SwingMeterProps) {
  const reduced = usePrefersReducedMotion()
  const markerRef = useRef<HTMLSpanElement>(null)
  const positionRef = useRef(0.5)

  useEffect(() => {
    handle.current = {
      read: () => (reduced ? 'good' : timingAt(positionRef.current)),
    }
    return () => {
      handle.current = null
    }
  }, [handle, reduced])

  useEffect(() => {
    if (reduced) {
      positionRef.current = 0.5
      return
    }
    if (!running) return

    let frame = 0
    const started = performance.now()
    const step = (now: number) => {
      const position = positionAt(now - started)
      positionRef.current = position
      if (markerRef.current) {
        markerRef.current.style.left = `${position * 100}%`
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [running, reduced])

  return (
    <div
      className="swing-meter"
      style={{ '--swing-accent': accent } as React.CSSProperties}
    >
      <div className="swing-track" aria-hidden>
        <span className="swing-band swing-band-good" />
        <span className="swing-band swing-band-perfect" />
        <span
          ref={markerRef}
          className={`swing-marker ${reduced ? 'swing-marker-static' : ''}`}
          style={reduced ? { left: '50%' } : undefined}
        />
      </div>
      <p className="swing-caption">
        {reduced ? (
          'Timing is off while your system asks for reduced motion — every strike counts as Good.'
        ) : result ? (
          <>
            Last swing:{' '}
            <strong className={`swing-result swing-result-${result}`}>
              {result === 'perfect'
                ? 'Perfect · 1.4× damage'
                : result === 'good'
                  ? 'Good · full damage'
                  : 'Weak · 0.6× damage'}
            </strong>
          </>
        ) : (
          'Strike as the marker crosses the gold band for extra damage.'
        )}
      </p>
    </div>
  )
}

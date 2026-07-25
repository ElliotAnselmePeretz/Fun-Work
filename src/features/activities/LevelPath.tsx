import { useEffect, useRef, useState, type CSSProperties, type Ref } from 'react'
import { LevelNode } from '../../components/LevelNode'
import { buildJourney, offsetFor, type JourneyStop } from '../../lib/journey'
import { levelFraction } from '../../lib/xp'
import type { Activity, ActivityProgress } from '../../types'

interface LevelPathProps {
  activity: Activity
  progress: ActivityProgress
  color: string
}

/**
 * Route geometry, in pixels. Connectors are drawn from these numbers rather
 * than measured from the DOM, so the trail is right on first paint and never
 * needs a layout read.
 */
const STEP = 30
const STOP_HEIGHT = 88

/** How long the arrival animation runs before the node settles. */
const ARRIVAL_MS = 1400

interface Connector {
  length: number
  angle: number
}

/** The leg back to the previous stop, as a length and a lean from vertical. */
function connectorTo(index: number): Connector {
  const dx = (offsetFor(index - 1) - offsetFor(index)) * STEP
  return {
    length: Math.hypot(dx, STOP_HEIGHT),
    angle: (Math.atan2(dx, STOP_HEIGHT) * 180) / Math.PI,
  }
}

/**
 * The winding trail of level stops, grouped into chapters. Renders as one
 * ordered list so a screen reader hears "Level 3 of 10, in progress" instead of
 * being walked through decorative nodes.
 */
export function LevelPath({ activity, progress, color }: LevelPathProps) {
  const currentRef = useRef<HTMLLIElement>(null)
  const arrival = useArrival(progress)

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [progress.currentLevelIndex])

  if (activity.levels.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        No levels yet — add some from the activity menu.
      </p>
    )
  }

  const sections = buildJourney(activity, progress)
  const fraction = levelFraction(progress)

  return (
    <div className="journey">
      {sections.map((section) => (
        <section
          key={section.chapter.id}
          className={`journey-chapter ${
            section.cleared ? 'journey-chapter-cleared' : ''
          } ${section.active ? 'journey-chapter-active' : ''}`}
          style={
            {
              '--chapter-accent': section.chapter.accent,
              '--chapter-terrain': `url(${section.chapter.terrain})`,
            } as CSSProperties
          }
          aria-label={section.chapter.name}
        >
          <header className="journey-banner">
            <span className="journey-banner-name">{section.chapter.name}</span>
            <span className="journey-banner-state">
              {section.cleared
                ? 'Cleared'
                : section.active
                  ? 'You are here'
                  : 'Ahead'}
            </span>
          </header>

          <ol className="journey-stops">
            {section.stops.map((stop) => (
              <Stop
                key={stop.level.id}
                stop={stop}
                color={color}
                fraction={fraction}
                arrived={arrival === stop.index}
                total={activity.levels.length}
                stopRef={stop.state === 'current' ? currentRef : undefined}
              />
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

interface StopProps {
  stop: JourneyStop
  color: string
  fraction: number
  arrived: boolean
  total: number
  stopRef?: Ref<HTMLLIElement>
}

function Stop({ stop, color, fraction, arrived, total, stopRef }: StopProps) {
  const { level, index, state, offset, isChapterEnd } = stop
  const name = level.name || `Level ${index + 1}`
  const connector = index > 0 ? connectorTo(index) : undefined

  return (
    <li
      ref={stopRef}
      className={`journey-stop journey-stop-${state}`}
      style={{ '--offset': offset } as CSSProperties}
      aria-current={state === 'current' ? 'step' : undefined}
    >
      {connector && (
        <span
          aria-hidden
          className="journey-link"
          style={{
            height: `${connector.length}px`,
            transform: `translateX(-50%) rotate(${connector.angle}deg)`,
            // Travelled legs take the category colour; the road ahead stays grey.
            ...(state === 'done' ? { color } : undefined),
          }}
        />
      )}

      <LevelNode
        index={index}
        name={name}
        state={state}
        color={color}
        fraction={fraction}
        landmark={isChapterEnd}
        justReached={arrived}
      />

      <span className="journey-stop-name">{name}</span>
      <span className="sr-only">{`Level ${index + 1} of ${total}`}</span>
    </li>
  )
}

/**
 * The index of the stop just cleared, for as long as its arrival animation
 * runs. Watching the derived level index means the celebration fires on a real
 * advance — including one caused by editing levels — and never on a re-render.
 */
function useArrival(progress: ActivityProgress): number | undefined {
  const [arrival, setArrival] = useState<number>()
  const previous = useRef(progress.currentLevelIndex)

  useEffect(() => {
    const before = previous.current
    previous.current = progress.currentLevelIndex
    if (progress.currentLevelIndex <= before) return

    setArrival(progress.currentLevelIndex - 1)
    const timer = setTimeout(() => setArrival(undefined), ARRIVAL_MS)
    return () => clearTimeout(timer)
  }, [progress.currentLevelIndex])

  return arrival
}

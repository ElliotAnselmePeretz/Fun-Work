import type { CSSProperties } from 'react'
import { GameIcon } from './GameIcon'
import { shade, withAlpha } from '../lib/palette'
import type { LevelState } from '../lib/xp'

interface LevelNodeProps {
  index: number
  name: string
  state: LevelState
  color: string
  /** 0..1 through the current level. Only drawn on the current stop. */
  fraction?: number
  /** Last stop of a chapter — drawn larger, as a landmark worth reaching. */
  landmark?: boolean
  /** Plays the arrival animation when this stop has just been reached. */
  justReached?: boolean
}

const STATE_LABEL: Record<LevelState, string> = {
  done: 'completed',
  current: 'in progress',
  locked: 'locked',
}

/**
 * One stop on the route. Purely presentational and non-interactive: the node is
 * hidden from assistive tech and the surrounding list item carries the readable
 * text, so a 30-stop path reads as one list rather than 30 dead buttons.
 */
export function LevelNode({
  index,
  name,
  state,
  color,
  fraction = 0,
  landmark = false,
  justReached = false,
}: LevelNodeProps) {
  const done = state === 'done'
  const current = state === 'current'
  const lit = done || current

  return (
    <span
      aria-hidden
      className={`level-node ${landmark ? 'level-node-landmark' : ''} ${
        justReached ? 'level-node-arrived' : ''
      }`}
      style={{ '--node-accent': color } as CSSProperties}
    >
      {current && (
        <span
          className="level-node-ring"
          style={{
            // A conic sweep rings the node with real progress without needing
            // another element or an SVG for every stop on the route.
            background: `conic-gradient(${color} ${fraction * 360}deg, ${withAlpha(
              color,
              0.16,
            )} 0deg)`,
          }}
        />
      )}
      <span
        className="level-node-face"
        style={{
          backgroundColor: lit ? color : '#e9e7f0',
          color: lit ? '#fff' : '#a9a5bb',
          boxShadow: `0 5px 0 ${lit ? shade(color, 0.72) : '#d3d0de'}`,
        }}
      >
        {done ? (
          <GameIcon name="check" size={landmark ? 26 : 22} strokeWidth={3.5} />
        ) : current ? (
          <span className="level-node-index">{index + 1}</span>
        ) : (
          <GameIcon name="lock" size={landmark ? 22 : 18} strokeWidth={2.75} />
        )}
      </span>
      <span className="sr-only">{`${name} — ${STATE_LABEL[state]}`}</span>
    </span>
  )
}

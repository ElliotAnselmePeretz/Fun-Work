import { shade, withAlpha } from '../lib/palette'
import type { LevelState } from '../lib/xp'

interface LevelNodeProps {
  index: number
  name: string
  state: LevelState
  color: string
  onClick?: () => void
}

/** One rung on the path: cleared, in progress, or still locked. */
export function LevelNode({ index, name, state, color, onClick }: LevelNodeProps) {
  const done = state === 'done'
  const current = state === 'current'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title={name}
      aria-label={`${name} — ${state}`}
      className="flex w-20 shrink-0 flex-col items-center gap-1.5 disabled:cursor-default"
    >
      <span
        className={`grid h-14 w-14 place-items-center rounded-full text-xl font-extrabold ${
          current ? 'animate-pop-in' : ''
        }`}
        style={{
          backgroundColor: done || current ? color : '#e5e5e5',
          color: done || current ? '#fff' : '#afafaf',
          boxShadow: `0 4px 0 ${done || current ? shade(color, 0.75) : '#cfcfcf'}`,
          // A soft halo marks the one node you're actually working on.
          outline: current ? `4px solid ${withAlpha(color, 0.25)}` : 'none',
        }}
      >
        {/* The exact fraction is already on the progress bar above; the node
            just needs to say which rung it is. */}
        {done ? '★' : current ? index + 1 : '🔒'}
      </span>
      <span
        className={`line-clamp-2 text-center text-[11px] font-bold leading-tight ${
          state === 'locked' ? 'text-hare' : 'text-ink'
        }`}
      >
        {name || `Level ${index + 1}`}
      </span>
    </button>
  )
}

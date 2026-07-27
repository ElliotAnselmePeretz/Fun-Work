import { AvatarIcon } from '../../components/AvatarIcon'
import { CoinAmount } from '../../components/CoinAmount'
import { PixelIcon } from '../../components/PixelIcon'
import { computeGoalProgress } from '../../lib/goals'
import type { Activity, SessionLogEntry } from '../../types'

interface HabitRowProps {
  habit: Activity
  logs: SessionLogEntry[]
  /** What ticking this right now would pay. */
  reward: number
  onTick: () => void
  onOpen: () => void
  busy?: boolean
  /** Bumped by the parent to replay the reward animation on this row. */
  celebrate?: number
}

/**
 * One habit: the commitment, how this week is going, and a tick.
 *
 * The week is drawn as a row of pips rather than a bar so the pace reads at a
 * glance — four filled of five is instantly "one to go", where a bar is just a
 * proportion. Ticking beyond the commitment keeps counting; going over is
 * never discouraged.
 */
export function HabitRow({
  habit,
  logs,
  reward,
  onTick,
  onOpen,
  busy,
  celebrate,
}: HabitRowProps) {
  const goals = computeGoalProgress(habit.goal, logs)
  const target = goals.weekly?.target ?? 0
  const done = goals.weekly?.done ?? logs.length
  const met = target > 0 && done >= target

  return (
    <div className="habit-row">
      <button
        type="button"
        onClick={onOpen}
        className="habit-row-open"
        aria-label={`Open ${habit.name}`}
      >
        <AvatarIcon
          name={habit.name}
          id={habit.id}
          stored={habit.emoji}
          className="habit-row-art h-7 w-7"
        />
        <span className="min-w-0 flex-1 text-left">
          <span className="habit-row-name block truncate">{habit.name}</span>
        <span className="habit-row-meta">
          {target > 0 ? (
            <>
              <span className="habit-pips" aria-hidden>
                {Array.from({ length: target }, (_, i) => (
                  <i
                    key={i}
                    className={i < done ? 'habit-pip-on' : ''}
                    style={{ '--pip': `${i * 70}ms` } as React.CSSProperties}
                  />
                ))}
              </span>
              <span className={`habit-row-count ${met ? 'habit-row-count-met' : ''}`}>
                {done}/{target} this week
              </span>
            </>
          ) : (
            <span className="habit-row-count">{done} this week</span>
          )}
          {goals.weeksKept > 0 && (
            <span className="habit-weeks">
              <PixelIcon name="flame" className="h-3.5 w-3.5" />
              {goals.weeksKept}w kept
            </span>
          )}
        </span>
        </span>
      </button>

      <button
        type="button"
        onClick={onTick}
        disabled={busy}
        aria-label={`Tick ${habit.name}, earns ${reward} coins`}
        className={`habit-tick ${met ? 'habit-tick-met' : ''}`}
      >
        {celebrate ? (
          <span key={celebrate} className="habit-tick-burst" aria-hidden />
        ) : null}
        <PixelIcon name="check" className="habit-tick-mark h-5 w-5" />
        <CoinAmount value={reward} size="sm" />
        {celebrate ? (
          <span key={`coin-${celebrate}`} className="habit-tick-float" aria-hidden>
            +{reward}
          </span>
        ) : null}
      </button>
    </div>
  )
}

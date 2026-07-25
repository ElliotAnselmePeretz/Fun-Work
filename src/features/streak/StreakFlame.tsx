import { recentDayWindow } from '../../lib/streak'
import { weekdayLabel } from '../../lib/date'
import type { StreakInfo } from '../../types'

interface StreakFlameProps {
  streak: StreakInfo
}

/** Flame counter plus a seven-day strip, so the chain is visible at a glance. */
export function StreakFlame({ streak }: StreakFlameProps) {
  const active = new Set(streak.activeDays)
  const week = recentDayWindow(7)

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span
          className={`text-4xl ${streak.loggedToday ? 'animate-flame' : 'grayscale opacity-50'}`}
          aria-hidden
        >
          🔥
        </span>
        <div className="leading-none">
          <div className="text-3xl font-extrabold text-flame">{streak.current}</div>
          <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">
            day{streak.current === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <div className="flex flex-1 justify-between gap-1">
        {week.map((day) => {
          const hit = active.has(day)
          return (
            <div key={day} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold uppercase text-hare">
                {weekdayLabel(day).slice(0, 1)}
              </span>
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold ${
                  hit ? 'bg-flame text-white' : 'bg-swan text-hare'
                }`}
                aria-label={`${day}: ${hit ? 'logged' : 'no activity'}`}
              >
                {hit ? '✓' : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { PixelIcon } from '../../components/PixelIcon'
import { addDays, todayKey } from '../../lib/date'
import type { SessionLogEntry } from '../../types'

interface HabitCalendarProps {
  logs: SessionLogEntry[]
  /** Times a week the habit was agreed to, shown as the standing commitment. */
  weeklyTarget?: number
  accent?: string
  /** Marks or unmarks a past day. Omit to render the calendar read-only. */
  onToggleDay?: (day: string) => void
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Day key for the first of a month, `offset` months from the current one. */
function monthStart(offset: number): string {
  const now = new Date()
  const date = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-01`
}

function daysInMonth(day: string): number {
  const [year, month] = day.split('-').map(Number)
  return new Date(year, month, 0).getDate()
}

/** Monday-first weekday index, 0–6. */
function weekdayIndex(day: string): number {
  const [year, month, date] = day.split('-').map(Number)
  return (new Date(year, month - 1, date).getDay() + 6) % 7
}

/**
 * One month of this habit, as an actual calendar.
 *
 * Every day of the month gets a numbered box, so the grid reads as dates rather
 * than as an abstract heatmap — a filled square with nothing in it tells you a
 * day was kept but never *which* day. Days before the habit's first session are
 * drawn plain rather than as failures, so starting today does not present you
 * with a page of misses.
 */
export function HabitCalendar({
  logs,
  weeklyTarget,
  accent = '#58cc02',
  onToggleDay,
}: HabitCalendarProps) {
  const [offset, setOffset] = useState(0)
  const [busy, setBusy] = useState<string>()

  const toggle = async (day: string) => {
    if (!onToggleDay) return
    setBusy(day)
    try {
      await onToggleDay(day)
    } finally {
      setBusy(undefined)
    }
  }

  const { first, cells, label, stats } = useMemo(() => {
    const byDay = new Map<string, number>()
    for (const log of logs) byDay.set(log.day, (byDay.get(log.day) ?? 0) + 1)

    const today = todayKey()
    const earliest = [...byDay.keys()].sort()[0]
    const first = monthStart(offset)
    const [year, month] = first.split('-').map(Number)

    const cells = Array.from({ length: daysInMonth(first) }, (_, i) => {
      const day = addDays(first, i)
      const count = byDay.get(day) ?? 0
      return {
        day,
        date: i + 1,
        count,
        today: day === today,
        future: day > today,
        before: earliest === undefined || day < earliest,
      }
    })

    return {
      first,
      cells,
      label: `${MONTHS[month - 1]} ${year}`,
      stats: {
        done: cells.filter((cell) => cell.count > 0).length,
        tracked: cells.filter((cell) => !cell.future && !cell.before).length,
      },
    }
  }, [logs, offset])

  // Blank leading slots so the 1st lands under its real weekday.
  const lead = weekdayIndex(first)

  return (
    <section
      className="habit-calendar"
      style={{ '--habit-accent': accent } as React.CSSProperties}
    >
      <header className="habit-calendar-head">
        <button
          type="button"
          onClick={() => setOffset((value) => value - 1)}
          className="habit-calendar-nav"
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className="min-w-0 text-center">
          <p className="habit-calendar-month">{label}</p>
          <p className="habit-calendar-caption">
            {stats.done} of {stats.tracked} day{stats.tracked === 1 ? '' : 's'} done
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOffset((value) => Math.min(0, value + 1))}
          disabled={offset === 0}
          className="habit-calendar-nav"
          aria-label="Next month"
        >
          ›
        </button>
      </header>

      <div className="habit-month">
        {WEEKDAYS.map((day, i) => (
          <span key={i} className="habit-month-weekday" aria-hidden>
            {day}
          </span>
        ))}

        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} aria-hidden />
        ))}

        {cells.map((cell, index) => {
          const editable = onToggleDay !== undefined && !cell.future
          const state = cell.count > 0 ? 'done' : 'not done'
          return (
            <button
              key={cell.day}
              type="button"
              disabled={!editable || busy === cell.day}
              onClick={() => void toggle(cell.day)}
              aria-pressed={cell.count > 0}
              title={
                cell.future
                  ? cell.day
                  : editable
                    ? `${cell.day} — ${state}. Tap to change.`
                    : `${cell.day} — ${state}`
              }
              style={{ '--day': `${index * 12}ms` } as React.CSSProperties}
              className={`habit-day ${
                cell.count > 0
                  ? 'habit-day-done'
                  : cell.future || cell.before
                    ? 'habit-day-idle'
                    : 'habit-day-off'
              } ${cell.today ? 'habit-day-today' : ''} ${
                editable ? 'habit-day-editable' : ''
              }`}
            >
              <span className="habit-day-number">{cell.date}</span>
              {cell.count > 1 && (
                <span className="habit-day-extra" aria-hidden>
                  ×{cell.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="habit-calendar-legend">
        <span className="habit-day-chip habit-day-done" aria-hidden />
        Done
        <span className="habit-day-chip habit-day-off ml-2" aria-hidden />
        Not done
        {weeklyTarget ? (
          <span className="habit-calendar-legend-note">
            <PixelIcon name="flame" className="h-3.5 w-3.5" />
            {weeklyTarget}× a week agreed
          </span>
        ) : null}
      </p>
      {onToggleDay && (
        <p className="habit-calendar-hint">
          Forgot to tick one? Tap any past day to correct it.
        </p>
      )}
    </section>
  )
}

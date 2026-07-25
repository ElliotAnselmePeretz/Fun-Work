import { useMemo } from 'react'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { GameIcon } from '../components/GameIcon'
import { ProgressBar } from '../components/ProgressBar'
import { ScreenHeader } from '../components/ScreenHeader'
import {
  useActivities,
  useCategories,
  useCoinSummary,
  useLogs,
  useStreak,
} from '../hooks/useData'
import { multiplierLabel, nextCoinMultiplier } from '../lib/coins'
import { dayKeyToDate } from '../lib/date'
import { navigate } from '../lib/router'
import { recentDayWindow } from '../lib/streak'
import { AvatarIcon } from '../components/AvatarIcon'

const WINDOW_DAYS = 30

export function StatsScreen() {
  const logs = useLogs()
  const categories = useCategories()
  const activities = useActivities()
  const streak = useStreak()
  const coins = useCoinSummary()

  const perDay = useMemo(() => {
    if (!logs) return null
    const counts = new Map<string, number>()
    for (const log of logs) counts.set(log.day, (counts.get(log.day) ?? 0) + 1)
    return recentDayWindow(WINDOW_DAYS).map((day) => ({
      day,
      count: counts.get(day) ?? 0,
    }))
  }, [logs])

  const perCategory = useMemo(() => {
    if (!categories || !activities || !coins) return null
    const categoryCoins = new Map<string, number>()
    for (const activity of activities) {
      categoryCoins.set(
        activity.categoryId,
        (categoryCoins.get(activity.categoryId) ?? 0) +
          (coins.earnedByActivityId.get(activity.id) ?? 0),
      )
    }
    const total = [...categoryCoins.values()].reduce((sum, value) => sum + value, 0)
    return categories
      .map((category) => ({
        category,
        coinTotal: categoryCoins.get(category.id) ?? 0,
        total,
      }))
      .filter((row) => row.coinTotal > 0)
      .sort((a, b) => b.coinTotal - a.coinTotal)
  }, [categories, activities, coins])

  if (!logs || !perDay || !perCategory || !streak || !coins) return null

  if (logs.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <ScreenHeader title="Stats" />
        <EmptyState
          emoji="📊"
          title="Nothing to chart yet"
          description="Log a few sessions and your activity over time shows up here."
        />
      </div>
    )
  }

  const busiest = Math.max(...perDay.map((entry) => entry.count), 1)
  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader
        title="Stats"
        subtitle={`${logs.length} sessions logged`}
        action={
          <button
            onClick={() => navigate({ name: 'badges' })}
            aria-label="Open achievements"
            className="grid h-10 w-10 place-items-center rounded-2xl border border-swan bg-white text-violet shadow-sm"
          >
            <GameIcon name="trophy" size={20} />
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Coins earned" value={coins.earned.toLocaleString()} icon="coins" />
        <Stat label="Spendable" value={coins.balance.toLocaleString()} />
        <Stat label="Streak" value={`${streak.current}d`} />
        <Stat label="Next boost" value={multiplierLabel(nextCoinMultiplier(streak))} />
      </div>

      <section>
        <h2 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
          Last {WINDOW_DAYS} days
        </h2>
        <Card className="p-4">
          {/* Column heights are relative to the busiest day in the window, so
              the shape stays readable whatever the absolute volume. */}
          <div className="flex h-28 items-end gap-[3px]" role="img"
            aria-label={`Sessions per day over the last ${WINDOW_DAYS} days`}>
            {perDay.map((entry) => (
              <div
                key={entry.day}
                title={`${entry.day}: ${entry.count} session${entry.count === 1 ? '' : 's'}`}
                className="flex-1 rounded-t-sm bg-grass transition-[height]"
                style={{
                  height: `${Math.max(entry.count === 0 ? 3 : 8, (entry.count / busiest) * 100)}%`,
                  opacity: entry.count === 0 ? 0.25 : 1,
                }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-bold text-ink-soft">
            <span>
              {dayKeyToDate(perDay[0].day).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span>Today</span>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
          Coins per category
        </h2>
        <Card className="flex flex-col gap-3 p-4">
          {perCategory.map(({ category, coinTotal, total }) => (
            <div key={category.id}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-1.5 truncate font-extrabold">
                  <AvatarIcon
                    name={category.name}
                    id={category.id}
                    stored={category.emoji}
                  />
                  {category.name}
                </span>
                <span className="shrink-0 text-xs font-bold text-ink-soft">
                  {coinTotal.toLocaleString()} coins ·{' '}
                  {Math.round((coinTotal / total) * 100)}%
                </span>
              </div>
              <ProgressBar
                value={coinTotal / total}
                color={category.color}
                label={`${category.name} share of earned coins`}
              />
            </div>
          ))}
        </Card>
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: 'coins'
}) {
  return (
    <Card className="flex flex-col items-center gap-0.5 p-3">
      <span className="flex items-center gap-1.5 text-xl font-extrabold">
        {icon && <GameIcon name={icon} size={18} className="text-gold-dark" />}
        {value}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">
        {label}
      </span>
    </Card>
  )
}

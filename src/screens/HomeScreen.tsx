import { useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { GameIcon } from '../components/GameIcon'
import { ScreenHeader } from '../components/ScreenHeader'
import { CategoryForm } from '../features/categories/CategoryForm'
import { CategorySection } from '../features/categories/CategorySection'
import { StreakFlame } from '../features/streak/StreakFlame'
import {
  useActivities,
  useCategories,
  useCoinSummary,
  useLedgerEntries,
  useProgressMap,
  useRecentLogs,
  useStreak,
} from '../hooks/useData'
import { computeBossProgress } from '../lib/bosses'
import {
  COINS_PER_SESSION,
  multiplierLabel,
  nextCoinMultiplier,
} from '../lib/coins'
import { avatarSrcFor } from '../lib/avatars'
import { relativeDayLabel, timeLabel } from '../lib/date'
import { navigate } from '../lib/router'

export function HomeScreen() {
  const categories = useCategories()
  const activities = useActivities()
  const progressMap = useProgressMap()
  const streak = useStreak()
  const coins = useCoinSummary()
  const ledger = useLedgerEntries()
  const recent = useRecentLogs(6)
  const [addingCategory, setAddingCategory] = useState(false)

  // Dexie's live queries resolve async; render nothing rather than flashing an
  // empty state at someone who actually has data.
  if (!categories || !activities || !progressMap || !streak || !coins || !ledger) {
    return null
  }

  const activityById = new Map(activities.map((activity) => [activity.id, activity]))
  const nextMultiplier = nextCoinMultiplier(streak)
  const nextReward = Math.round(COINS_PER_SESSION * nextMultiplier)
  const bosses = computeBossProgress(ledger)
  const activeBoss = bosses.find((progress) => !progress.defeated && !progress.locked)
  const defeatedBosses = bosses.filter((progress) => progress.defeated).length

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader
        title="Fun-Work"
        subtitle="Turn today into a win"
        action={
          <button
            onClick={() => navigate({ name: 'shop' })}
            className="coin-pill"
            aria-label={`${coins.balance} coins. Open reward shop`}
          >
            <GameIcon name="coins" size={17} />
            {coins.balance.toLocaleString()}
          </button>
        }
      />

      <section className="quest-hero">
        <div className="banner-grid" aria-hidden />
        <div className="relative z-10 max-w-[74%]">
          <p className="banner-kicker">Daily campaign</p>
          <h2 className="mt-1 text-2xl font-black leading-tight text-white">
            {streak.loggedToday ? 'Momentum secured.' : 'One session starts the run.'}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="quest-chip">
              <GameIcon name="flame" size={14} />
              {multiplierLabel(nextMultiplier)} streak boost
            </span>
            <span className="quest-chip">
              <GameIcon name="coins" size={14} />
              +{nextReward} next session
            </span>
          </div>
          <button
            onClick={() => navigate({ name: 'arena' })}
            className="mt-5 flex items-center gap-2 text-sm font-black text-white"
          >
            <GameIcon name="swords" size={17} />
            {activeBoss ? `Fight ${activeBoss.boss.name}` : 'View completed arena'}
          </button>
        </div>
        <div className="quest-emblem" aria-hidden>
          <GameIcon name="shield" size={54} strokeWidth={1.35} />
          <span>{defeatedBosses}/{bosses.length}</span>
        </div>
      </section>

      <Card className="streak-card p-4">
        <StreakFlame streak={streak} />
      </Card>

      {categories.length === 0 ? (
        <EmptyState
          emoji="·"
          title="Nothing here yet"
          description="Create a category to group what you're tracking — like Physical or Schoolwork. Or paste a whole list at once."
        >
          <div className="mt-2 flex w-full flex-col gap-2">
            <Button size="lg" onClick={() => setAddingCategory(true)}>
              Create a category
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate({ name: 'bulk-add' })}
            >
              Paste a list
            </Button>
          </div>
        </EmptyState>
      ) : (
        <>
          {categories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              activities={activities.filter(
                (activity) => activity.categoryId === category.id,
              )}
              progressMap={progressMap}
            />
          ))}

          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1 border-2 border-dashed border-swan"
              onClick={() => setAddingCategory(true)}
            >
              + Category
            </Button>
            <Button
              variant="ghost"
              className="flex-1 border-2 border-dashed border-swan"
              onClick={() => navigate({ name: 'bulk-add' })}
            >
              Bulk add
            </Button>
          </div>
        </>
      )}

      {recent && recent.length > 0 && (
        <section>
          <div className="mb-2 flex items-end justify-between">
            <div>
              <p className="section-kicker">Adventure log</p>
              <h2 className="text-world text-lg font-black">Recent wins</h2>
            </div>
            <span className="text-xs font-bold text-white/65">
              {coins.earned.toLocaleString()} earned
            </span>
          </div>
          <Card className="divide-y-2 divide-swan/80 overflow-hidden">
            {recent.map((log) => {
              const activity = activityById.get(log.activityId)
              const reward = coins.rewardsByLogId.get(log.id)?.coins ?? COINS_PER_SESSION
              return (
                <div key={log.id} className="flex items-center gap-3 px-3 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-polar">
                    <img
                      src={avatarSrcFor(
                        activity?.name ?? 'deleted',
                        activity?.id ?? log.activityId,
                        activity?.emoji,
                      )}
                      alt=""
                      className="pixel-art h-6 w-6"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold">
                      {activity?.name ?? 'Deleted activity'}
                    </span>
                    <span className="block truncate text-xs text-ink-soft">
                      {relativeDayLabel(log.day)} · {timeLabel(log.at)}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold/15 px-2 py-1 text-xs font-black text-gold-dark">
                    <GameIcon name="coins" size={13} />
                    +{reward}
                  </span>
                </div>
              )
            })}
          </Card>
        </section>
      )}

      {addingCategory && (
        <CategoryForm
          open
          existingCount={categories.length}
          onClose={() => setAddingCategory(false)}
        />
      )}
    </div>
  )
}

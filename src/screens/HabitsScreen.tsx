import { useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CoinAmount } from '../components/CoinAmount'
import { EmptyState } from '../components/EmptyState'
import { PixelIcon } from '../components/PixelIcon'
import { ScreenHeader } from '../components/ScreenHeader'
import { ActivityForm } from '../features/activities/ActivityForm'
import { HabitRow } from '../features/activities/HabitRow'
import { logSession } from '../features/activities/logActions'
import { createCategory } from '../features/categories/categoryActions'
import { TrialRoadCard } from '../features/trials/TrialRoadCard'
import {
  useActivities,
  useCategories,
  useCoinSummary,
  useLedgerEntries,
  useLogs,
  useStreak,
} from '../hooks/useData'
import { COINS_PER_SESSION, multiplierLabel, nextCoinMultiplier } from '../lib/coins'
import { isHabit, logsByActivity } from '../lib/goals'
import { navigate } from '../lib/router'
import { worldTrialRoad } from '../lib/trials'
import type { Activity } from '../types'

/**
 * Habits: standing commitments you tick off.
 *
 * No levels, no difficulty and no journey — a habit is never finished, so the
 * only question the screen answers is whether you are keeping the pace you
 * agreed to this week.
 */
export function HabitsScreen() {
  const activities = useActivities()
  const categories = useCategories()
  const logs = useLogs()
  const ledger = useLedgerEntries()
  const coins = useCoinSummary()
  const streak = useStreak()
  const [adding, setAdding] = useState(false)
  const [busyId, setBusyId] = useState<string>()
  const [pendingCategoryId, setPendingCategoryId] = useState<string>()

  const { habits, byActivity } = useMemo(() => {
    if (!activities || !logs) return { habits: [], byActivity: new Map() }
    return {
      habits: activities.filter(isHabit),
      byActivity: logsByActivity(logs),
    }
  }, [activities, logs])

  if (!activities || !categories || !logs || !ledger || !coins || !streak) return null

  const nextMultiplier = nextCoinMultiplier(streak)
  const nextReward = Math.round(COINS_PER_SESSION * nextMultiplier)

  // A habit belongs to a category for storage reasons only; the user never has
  // to pick one, so an implicit "Habits" bucket is created on the first add.
  const existing = categories.find((c) => c.name === 'Habits') ?? categories[0]
  const formCategory = categories.find((c) => c.id === pendingCategoryId) ?? existing

  const startAdding = async () => {
    if (!existing) {
      const id = await createCategory({ name: 'Habits' })
      setPendingCategoryId(id)
    }
    setAdding(true)
  }

  const tick = async (habit: Activity) => {
    setBusyId(habit.id)
    try {
      await logSession(habit.id)
    } finally {
      setBusyId(undefined)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader
        title="Habits"
        subtitle="Tick what you kept to this week"
        action={
          <button
            onClick={() => navigate({ name: 'shop' })}
            className="coin-pill"
            aria-label={`${coins.balance} coins. Open the Armory`}
          >
            <CoinAmount value={coins.balance} />
          </button>
        }
      />

      <section className="reward-banner">
        <div className="min-w-0">
          <p className="section-kicker">Next tick pays</p>
          <CoinAmount value={nextReward} gain size="lg" className="mt-0.5" />
        </div>
        <div className="reward-banner-boost">
          <PixelIcon name="flame" className="h-4 w-4" />
          <span>
            {multiplierLabel(nextMultiplier)} from a {streak.current}-day streak
          </span>
        </div>
      </section>

      {habits.length === 0 ? (
        <EmptyState
          icon="scroll"
          title="No habits yet"
          description="A habit is something you keep doing — the gym four times a week, reading every night. Pick a pace and tick it off as you go."
        >
          <Button onClick={() => void startAdding()}>Add a habit</Button>
        </EmptyState>
      ) : (
        <>
          <Card className="divide-y-2 divide-swan/70 overflow-hidden">
            {habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                logs={byActivity.get(habit.id) ?? []}
                reward={nextReward}
                busy={busyId === habit.id}
                onTick={() => void tick(habit)}
              />
            ))}
          </Card>

          <Button
            variant="ghost"
            className="border-2 border-dashed border-swan"
            onClick={() => void startAdding()}
          >
            Add a habit
          </Button>
        </>
      )}

      <TrialRoadCard
        road={worldTrialRoad(ledger, activities)}
        title="Overworld trials"
        caption="Beaten by keeping any habit alive, day after day."
      />

      {formCategory && (
        <ActivityForm
          open={adding}
          onClose={() => setAdding(false)}
          category={formCategory}
          kind="habit"
        />
      )}
    </div>
  )
}

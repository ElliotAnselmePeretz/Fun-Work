import { useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { ScreenHeader } from '../components/ScreenHeader'
import { CategoryForm } from '../features/categories/CategoryForm'
import { CategorySection } from '../features/categories/CategorySection'
import { StreakFlame } from '../features/streak/StreakFlame'
import {
  useActivities,
  useCategories,
  useProgressMap,
  useRecentLogs,
  useStreak,
  useTotalXp,
} from '../hooks/useData'
import { relativeDayLabel, timeLabel } from '../lib/date'
import { navigate } from '../lib/router'

export function HomeScreen() {
  const categories = useCategories()
  const activities = useActivities()
  const progressMap = useProgressMap()
  const streak = useStreak()
  const totalXp = useTotalXp()
  const recent = useRecentLogs(6)
  const [addingCategory, setAddingCategory] = useState(false)

  // Dexie's live queries resolve async; render nothing rather than flashing an
  // empty state at someone who actually has data.
  if (!categories || !activities || !progressMap || !streak) return null

  const activityById = new Map(activities.map((activity) => [activity.id, activity]))
  const categoryById = new Map(categories.map((category) => [category.id, category]))

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader
        title="Fun-Work"
        subtitle={`${totalXp?.toLocaleString() ?? 0} XP total`}
      />

      <Card className="p-4">
        <StreakFlame streak={streak} />
      </Card>

      {categories.length === 0 ? (
        <EmptyState
          emoji="🌱"
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
          <h2 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
            Recent
          </h2>
          <Card className="divide-y-2 divide-swan">
            {recent.map((log) => {
              const activity = activityById.get(log.activityId)
              const category = activity ? categoryById.get(activity.categoryId) : undefined
              return (
                <div key={log.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="text-lg" aria-hidden>
                    {activity?.emoji ?? '⭐'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold">
                      {activity?.name ?? 'Deleted activity'}
                    </span>
                    <span className="block truncate text-xs text-ink-soft">
                      {relativeDayLabel(log.day)} · {timeLabel(log.at)}
                    </span>
                  </span>
                  <span
                    className="shrink-0 text-xs font-extrabold"
                    style={{ color: category?.color ?? '#afafaf' }}
                  >
                    +{log.xp}
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

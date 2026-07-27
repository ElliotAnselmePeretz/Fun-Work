import { useState, type CSSProperties } from 'react'
import { Button } from '../components/Button'
import { CoinAmount } from '../components/CoinAmount'
import { EmptyState } from '../components/EmptyState'
import { PixelIcon } from '../components/PixelIcon'
import { ScreenHeader } from '../components/ScreenHeader'
import { CategoryForm } from '../features/categories/CategoryForm'
import { createCategory } from '../features/categories/categoryActions'
import { CategorySection } from '../features/categories/CategorySection'
import { ActivityForm } from '../features/activities/ActivityForm'
import {
  useActivities,
  useCategories,
  useCoinSummary,
  useProgressMap,
} from '../hooks/useData'
import { COINS_PER_WORK } from '../lib/coins'
import { isWork } from '../lib/goals'
import { navigate } from '../lib/router'

/**
 * Work: the things you are working *through* and will one day finish.
 *
 * This is where levels, difficulty and the journey live. Unlike a habit, a
 * work item has an end — so it is presented as a road with milestones rather
 * than as a weekly tick.
 */
export function WorkScreen() {
  const categories = useCategories()
  const activities = useActivities()
  const progressMap = useProgressMap()
  const coins = useCoinSummary()
  const [addingCategory, setAddingCategory] = useState(false)
  const [addingWork, setAddingWork] = useState(false)
  const [pendingCategoryId, setPendingCategoryId] = useState<string>()

  if (!categories || !activities || !progressMap || !coins) return null

  const work = activities.filter(isWork)

  // A category belongs on this screen when it already holds work, or when it is
  // still empty and so available to put work into. Without that second case a
  // freshly created category was filtered straight back out, which left no
  // "+ Add activity" button anywhere and made work impossible to create.
  const visible = categories.filter((category) => {
    const inCategory = activities.filter(
      (activity) => activity.categoryId === category.id,
    )
    return inCategory.length === 0 || inCategory.some(isWork)
  })

  const formCategory =
    categories.find((category) => category.id === pendingCategoryId) ?? visible[0]

  /** Guarantees somewhere to file the work, then opens the form. */
  const startAddingWork = async () => {
    const target = visible[0]?.id ?? (await createCategory({ name: 'Work' }))
    setPendingCategoryId(target)
    setAddingWork(true)
  }

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader
        title="Work"
        subtitle="Projects with an end in sight"
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
          <p className="section-kicker">Each session pays</p>
          <CoinAmount value={COINS_PER_WORK} gain size="lg" className="mt-0.5" />
        </div>
        <div className="reward-banner-boost">
          <PixelIcon name="chest" className="h-4 w-4" />
          <span>Flat rate — no streak needed</span>
        </div>
      </section>

      {work.length === 0 ? (
        <EmptyState
          icon="map"
          title="No work yet"
          description="Work is anything with a finish line — a course, a project, a qualification. It gets levels, a difficulty and a journey through the world."
        >
          <div className="mt-2 flex w-full flex-col gap-2">
            <Button size="lg" onClick={() => void startAddingWork()}>
              Add your first work
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
          {visible.map((category, index) => (
            <div
              key={category.id}
              className="stagger-in"
              style={{ '--stagger': `${index * 60}ms` } as CSSProperties}
            >
              <CategorySection
                category={category}
                activities={work.filter(
                  (activity) => activity.categoryId === category.id,
                )}
                progressMap={progressMap}
                kind="work"
              />
            </div>
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

      {formCategory && (
        <ActivityForm
          open={addingWork}
          onClose={() => setAddingWork(false)}
          category={formCategory}
          kind="work"
        />
      )}

      <CategoryForm
        open={addingCategory}
        onClose={() => setAddingCategory(false)}
        existingCount={categories.length}
      />
    </div>
  )
}

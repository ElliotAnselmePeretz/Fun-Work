import { useState } from 'react'
import { GameIcon } from '../../components/GameIcon'
import { avatarSrcFor } from '../../lib/avatars'
import { withAlpha } from '../../lib/palette'
import type { Activity, ActivityProgress, Category } from '../../types'
import { ActivityCard } from '../activities/ActivityCard'
import { ActivityForm } from '../activities/ActivityForm'
import { CategoryForm } from './CategoryForm'

interface CategorySectionProps {
  category: Category
  activities: Activity[]
  progressMap: Map<string, ActivityProgress>
}

export function CategorySection({
  category,
  activities,
  progressMap,
}: CategorySectionProps) {
  const [addingActivity, setAddingActivity] = useState(false)
  const [editingCategory, setEditingCategory] = useState(false)

  return (
    <section className="flex flex-col gap-2">
      <header
        className="flex items-center gap-2 rounded-3xl border border-white/70 px-3 py-2.5 shadow-sm"
        style={{ backgroundColor: withAlpha(category.color, 0.12) }}
      >
        <img
          src={avatarSrcFor(category.name, category.id)}
          alt=""
          className="pixel-art h-6 w-6 shrink-0"
        />
        <h2 className="flex-1 truncate font-extrabold" style={{ color: category.color }}>
          {category.name}
        </h2>
        <button
          onClick={() => setEditingCategory(true)}
          aria-label={`Edit ${category.name}`}
          className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-white/70"
        >
          <GameIcon name="settings" size={17} />
        </button>
      </header>

      {activities.map((activity) => {
        const progress = progressMap.get(activity.id)
        if (!progress) return null
        return (
          <ActivityCard
            key={activity.id}
            activity={activity}
            progress={progress}
            color={category.color}
          />
        )
      })}

      <button
        onClick={() => setAddingActivity(true)}
        className="rounded-2xl border-2 border-dashed border-swan py-2.5 text-sm font-extrabold text-ink-soft transition-colors hover:border-hare hover:bg-white"
      >
        + Add activity
      </button>

      {addingActivity && (
        <ActivityForm
          open
          category={category}
          onClose={() => setAddingActivity(false)}
        />
      )}
      {editingCategory && (
        <CategoryForm open category={category} onClose={() => setEditingCategory(false)} />
      )}
    </section>
  )
}

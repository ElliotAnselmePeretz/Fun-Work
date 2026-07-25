import { useState } from 'react'
import { Card } from '../components/Card'
import { GameIcon } from '../components/GameIcon'
import { ProgressBar } from '../components/ProgressBar'
import { ScreenHeader } from '../components/ScreenHeader'
import { ActivityForm } from '../features/activities/ActivityForm'
import { LevelEditor } from '../features/activities/LevelEditor'
import { LevelPath } from '../features/activities/LevelPath'
import { LogButton } from '../features/activities/LogButton'
import { deleteLog } from '../features/activities/logActions'
import {
  useActivity,
  useActivityLogs,
  useCategories,
  useCoinSummary,
} from '../hooks/useData'
import { COINS_PER_SESSION } from '../lib/coins'
import { relativeDayLabel, timeLabel } from '../lib/date'
import { summarizeJourney } from '../lib/journey'
import { computeProgress, levelFraction } from '../lib/xp'

interface ActivityScreenProps {
  activityId: string
}

export function ActivityScreen({ activityId }: ActivityScreenProps) {
  const activity = useActivity(activityId)
  const logs = useActivityLogs(activityId)
  const categories = useCategories()
  const coins = useCoinSummary()
  const [editing, setEditing] = useState(false)
  const [editingLevels, setEditingLevels] = useState(false)

  if (activity === undefined || !logs || !categories || !coins) return null
  if (activity === null) {
    return <ScreenHeader back title="Not found" subtitle="This activity was deleted." />
  }

  const category = categories.find((c) => c.id === activity.categoryId)
  const color = category?.color ?? '#58cc02'
  const progress = computeProgress(activity, logs)
  const journey = summarizeJourney(activity, progress)
  const currentLevel = activity.levels[progress.currentLevelIndex]
  const recent = [...logs].sort((a, b) => b.at - a.at).slice(0, 20)

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader
        back
        title={activity.name}
        subtitle={category?.name}
        action={
          <button
            onClick={() => setEditing(true)}
            aria-label="Edit activity"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-swan/60"
          >
            <GameIcon name="settings" size={20} />
          </button>
        }
      />

      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="flex items-center gap-2 font-extrabold">
            {progress.isComplete
              ? (
                  <>
                    <GameIcon name="trophy" size={18} className="text-gold-dark" />
                    Every level complete
                  </>
                )
              : (currentLevel?.name ?? 'Level')}
          </span>
          <span className="text-sm font-bold text-ink-soft">
            {progress.isComplete
              ? `${progress.totalSessions} sessions`
              : `${progress.sessionsIntoLevel}/${progress.sessionsForLevel}`}
          </span>
        </div>
        <ProgressBar
          value={levelFraction(progress)}
          color={color}
          label="Progress to next level"
        />
        <div className="flex justify-between text-xs font-bold text-ink-soft">
          <span>
            {journey.levelsCleared}/{journey.levelTotal} stops ·{' '}
            {journey.chaptersCleared}/{journey.chapterTotal} chapters
          </span>
          <span>
            {(coins.earnedByActivityId.get(activity.id) ?? 0).toLocaleString()} coins
          </span>
        </div>
      </Card>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">
            {journey.currentChapter
              ? `Journey · ${journey.currentChapter.name}`
              : 'Journey · complete'}
          </h2>
          <button
            onClick={() => setEditingLevels(true)}
            className="text-xs font-extrabold uppercase tracking-wide text-sky"
          >
            Edit levels
          </button>
        </div>
        <LevelPath activity={activity} progress={progress} color={color} />
      </section>

      <LogButton activityId={activity.id} color={color} size="lg" label="+1 Session" />

      {recent.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
            History
          </h2>
          <Card className="divide-y-2 divide-swan">
            {recent.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="min-w-0 flex-1 text-sm font-bold">
                  {relativeDayLabel(log.day)}
                  <span className="ml-2 font-normal text-ink-soft">
                    {timeLabel(log.at)}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-1 text-xs font-black text-gold-dark">
                  <GameIcon name="coins" size={13} />
                  +{coins.rewardsByLogId.get(log.id)?.coins ?? COINS_PER_SESSION}
                </span>
                <button
                  onClick={() => deleteLog(log.id)}
                  aria-label="Delete this log"
                  className="grid h-7 w-7 place-items-center rounded-full text-hare hover:bg-cardinal/10 hover:text-cardinal"
                >
                  ×
                </button>
              </div>
            ))}
          </Card>
        </section>
      )}

      {editingLevels && (
        <LevelEditor
          open
          activity={activity}
          currentLevelIndex={progress.currentLevelIndex}
          onClose={() => setEditingLevels(false)}
        />
      )}

      {editing && category && (
        <ActivityForm
          open
          category={category}
          activity={activity}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  )
}

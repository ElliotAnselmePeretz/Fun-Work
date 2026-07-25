import { useEffect, useRef } from 'react'
import { LevelNode } from '../../components/LevelNode'
import { levelState } from '../../lib/xp'
import type { Activity, ActivityProgress } from '../../types'

interface LevelPathProps {
  activity: Activity
  progress: ActivityProgress
  color: string
}

/**
 * The horizontal trail of level nodes. Scrolls the active node into view on
 * mount so a long ladder always opens at the rung you're actually on.
 */
export function LevelPath({ activity, progress, color }: LevelPathProps) {
  const currentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    currentRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [progress.currentLevelIndex])

  if (activity.levels.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        No levels yet — add some from the activity menu.
      </p>
    )
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2">
      <div className="flex items-start gap-1">
        {activity.levels.map((level, index) => {
          const state = levelState(index, progress)
          return (
            <div
              key={level.id}
              ref={state === 'current' ? currentRef : undefined}
              className="flex items-center"
            >
              <LevelNode
                index={index}
                name={level.name}
                state={state}
                color={color}
              />
              {index < activity.levels.length - 1 && (
                <span
                  aria-hidden
                  className="mb-6 h-1.5 w-3 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      index < progress.currentLevelIndex ? color : '#e5e5e5',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

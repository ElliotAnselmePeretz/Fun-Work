import type { Activity, ActivityProgress, Level, SessionLogEntry } from '../types'
import { newId } from './id'

export const DEFAULT_LEVEL_COUNT = 10
export const MIN_LEVEL_COUNT = 1
export const MAX_LEVEL_COUNT = 30

/**
 * Sessions needed for level `i` (0-based). Gently escalating: early levels
 * land fast so a new activity feels rewarding within a couple of taps, later
 * ones stretch out.
 */
export function defaultSessionsForLevel(index: number): number {
  return 2 + Math.floor(index * 1.5)
}

/** The auto-generated ladder every new activity starts with. */
export function makeDefaultLevels(count = DEFAULT_LEVEL_COUNT): Level[] {
  return Array.from({ length: count }, (_, i) => ({
    id: newId(),
    name: `Level ${i + 1}`,
    sessionsRequired: defaultSessionsForLevel(i),
  }))
}

/** Turn user-typed milestone names into levels, keeping the default pacing. */
export function makeLevelsFromNames(names: string[]): Level[] {
  return names.map((name, i) => ({
    id: newId(),
    name: name.trim(),
    sessionsRequired: defaultSessionsForLevel(i),
  }))
}

/**
 * Walk the ladder to find where `totalSessions` lands. Progress is derived
 * from the log history rather than stored, so it can never drift out of sync
 * with the logs — and editing levels later recomputes cleanly.
 */
export function computeProgress(
  activity: Activity,
  logs: SessionLogEntry[],
): ActivityProgress {
  const totalSessions = logs.length

  let remaining = totalSessions
  let levelIndex = 0
  while (
    levelIndex < activity.levels.length &&
    remaining >= activity.levels[levelIndex].sessionsRequired
  ) {
    remaining -= activity.levels[levelIndex].sessionsRequired
    levelIndex += 1
  }

  const isComplete = levelIndex >= activity.levels.length

  return {
    activityId: activity.id,
    totalSessions,
    currentLevelIndex: levelIndex,
    sessionsIntoLevel: isComplete ? 0 : remaining,
    sessionsForLevel: isComplete ? 0 : activity.levels[levelIndex].sessionsRequired,
    isComplete,
  }
}

/** 0..1 progress through the current level. Complete activities read as full. */
export function levelFraction(progress: ActivityProgress): number {
  if (progress.isComplete || progress.sessionsForLevel === 0) return 1
  return progress.sessionsIntoLevel / progress.sessionsForLevel
}

export type LevelState = 'done' | 'current' | 'locked'

export function levelState(
  index: number,
  progress: ActivityProgress,
): LevelState {
  if (index < progress.currentLevelIndex) return 'done'
  if (index === progress.currentLevelIndex) return 'current'
  return 'locked'
}

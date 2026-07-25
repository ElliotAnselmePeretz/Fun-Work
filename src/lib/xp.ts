import type {
  Activity,
  ActivityDifficulty,
  ActivityProgress,
  Level,
  SessionLogEntry,
} from '../types'
import { newId } from './id'

export const DEFAULT_LEVEL_COUNT = 10
export const MIN_LEVEL_COUNT = 1
export const MAX_LEVEL_COUNT = 30

export interface DifficultyDefinition {
  id: ActivityDifficulty
  name: string
  description: string
  multiplier: number
}

export const DIFFICULTIES: DifficultyDefinition[] = [
  {
    id: 'gentle',
    name: 'Gentle',
    description: 'Quick wins for a new or light habit.',
    multiplier: 0.75,
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Steady progress with a balanced climb.',
    multiplier: 1,
  },
  {
    id: 'hard',
    name: 'Hard',
    description: 'A demanding path with longer levels.',
    multiplier: 1.35,
  },
  {
    id: 'legendary',
    name: 'Legendary',
    description: 'A serious long-term challenge.',
    multiplier: 1.7,
  },
]

export function activityDifficulty(
  activity: Pick<Activity, 'difficulty'>,
): ActivityDifficulty {
  return activity.difficulty ?? 'standard'
}

export function difficultyDefinition(
  difficulty: ActivityDifficulty = 'standard',
): DifficultyDefinition {
  return (
    DIFFICULTIES.find((candidate) => candidate.id === difficulty) ??
    DIFFICULTIES[1]
  )
}

/**
 * Sessions needed for level `i` (0-based). Gently escalating: early levels
 * land fast so a new activity feels rewarding within a couple of taps, later
 * ones stretch out.
 */
export function defaultSessionsForLevel(
  index: number,
  difficulty: ActivityDifficulty = 'standard',
): number {
  const baseline = 2 + Math.floor(index * 1.5)
  const scaled = baseline * difficultyDefinition(difficulty).multiplier
  const sessions =
    difficulty === 'gentle'
      ? Math.floor(scaled)
      : difficulty === 'legendary'
        ? Math.ceil(scaled)
        : Math.round(scaled)
  return Math.max(1, sessions)
}

/** The auto-generated ladder every new activity starts with. */
export function makeDefaultLevels(
  count = DEFAULT_LEVEL_COUNT,
  difficulty: ActivityDifficulty = 'standard',
): Level[] {
  const safeCount = Math.min(MAX_LEVEL_COUNT, Math.max(MIN_LEVEL_COUNT, count))
  return Array.from({ length: safeCount }, (_, i) => ({
    id: newId(),
    name: `Level ${i + 1}`,
    sessionsRequired: defaultSessionsForLevel(i, difficulty),
  }))
}

/** Turn user-typed milestone names into levels, keeping the default pacing. */
export function makeLevelsFromNames(
  names: string[],
  difficulty: ActivityDifficulty = 'standard',
): Level[] {
  return names.slice(0, MAX_LEVEL_COUNT).map((name, i) => ({
    id: newId(),
    name: name.trim(),
    sessionsRequired: defaultSessionsForLevel(i, difficulty),
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

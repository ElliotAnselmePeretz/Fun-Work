import type { GameIconName } from '../components/GameIcon'
import type { Activity, Id, LogEntry, SessionLogEntry } from '../types'
import { isHabit, logsByActivity } from './goals'
import { computeStreak } from './streak'

/**
 * Declared locally rather than imported from `coins`, which imports this module
 * for trial payouts. Keeping the predicate here avoids the import cycle.
 */
function isSession(log: LogEntry): log is SessionLogEntry {
  return log.kind === undefined || log.kind === 'session'
}

/**
 * Streak trials: bosses you beat by turning up, not by buying a bigger axe.
 *
 * The Arena rewards spending power; this rewards consistency, so the two
 * progression tracks never collapse into each other.
 *
 * Nothing here is stored. A trial is beaten when your *longest* run reaches its
 * day count — deliberately the best run ever rather than the current one, so
 * breaking a streak costs you momentum but can never take a victory back. The
 * current run is shown separately, as progress toward the next trial.
 */

export interface Trial {
  id: Id
  name: string
  /** Consecutive days needed to beat it. */
  days: number
  icon: GameIconName
  accent: string
  /** Coins paid out once, the first time it is cleared. */
  coinReward: number
}

/** Per-habit trials. Modest rewards — the point is the road, not the payout. */
export const HABIT_TRIALS: Trial[] = [
  { id: 'spark', name: 'First Spark', days: 3, icon: 'sparkles', accent: '#58cc02', coinReward: 15 },
  { id: 'ember', name: 'Steady Ember', days: 7, icon: 'flame', accent: '#ff9600', coinReward: 40 },
  { id: 'forge', name: 'The Forge', days: 14, icon: 'hammer', accent: '#c0803a', coinReward: 90 },
  { id: 'keep', name: 'The Long Keep', days: 30, icon: 'castle', accent: '#1cb0f6', coinReward: 200 },
  { id: 'summit', name: 'The Summit', days: 60, icon: 'trophy', accent: '#ce82ff', coinReward: 450 },
  { id: 'eternal', name: 'The Eternal Watch', days: 100, icon: 'crown', accent: '#ffc800', coinReward: 900 },
]

/**
 * Overworld trials, driven by the streak across *every* habit. Rarer and worth
 * far more, because keeping any habit alive daily is the harder ask.
 */
export const WORLD_TRIALS: Trial[] = [
  { id: 'world-gate', name: 'The Gatekeeper', days: 7, icon: 'shield', accent: '#4c8df6', coinReward: 120 },
  { id: 'world-warden', name: 'Warden of Days', days: 21, icon: 'swords', accent: '#6c5ce7', coinReward: 350 },
  { id: 'world-crown', name: 'The Year-King', days: 50, icon: 'crown', accent: '#ff5a2b', coinReward: 800 },
  { id: 'world-eternal', name: 'The Unbroken', days: 120, icon: 'trophy', accent: '#ffc800', coinReward: 1800 },
  { id: 'world-myth', name: 'The Myth', days: 365, icon: 'castle', accent: '#ff3d6e', coinReward: 5000 },
]

export interface TrialProgress {
  trial: Trial
  beaten: boolean
  /** Days still needed, from the current run. Zero once beaten. */
  remaining: number
  /** How far the current run has come toward this trial, 0–1. */
  fraction: number
}

export interface TrialRoad {
  /** Best run ever, which is what decides victories. */
  longest: number
  /** The run in progress, which is what the bars fill with. */
  current: number
  trials: TrialProgress[]
  /** The next trial still to beat, or undefined once the road is finished. */
  next?: TrialProgress
  beatenCount: number
}

/** Walks a ladder of trials against one streak. */
export function computeTrialRoad(
  ladder: Trial[],
  logs: SessionLogEntry[],
): TrialRoad {
  const streak = computeStreak(logs)
  const trials = ladder.map((trial) => {
    const beaten = streak.longest >= trial.days
    return {
      trial,
      beaten,
      remaining: beaten ? 0 : Math.max(0, trial.days - streak.current),
      fraction: beaten ? 1 : Math.min(1, streak.current / trial.days),
    }
  })

  return {
    longest: streak.longest,
    current: streak.current,
    trials,
    next: trials.find((entry) => !entry.beaten),
    beatenCount: trials.filter((entry) => entry.beaten).length,
  }
}

/** The trial road for one habit, from its own logs. */
export function habitTrialRoad(logs: SessionLogEntry[]): TrialRoad {
  return computeTrialRoad(HABIT_TRIALS, logs)
}

/**
 * The overworld road, from every habit's logs pooled together. Work items are
 * excluded on purpose: clearing a one-off backlog is not a daily practice, and
 * counting it would let a burst of admin carry a habit streak.
 */
export function worldTrialRoad(
  entries: LogEntry[],
  activities: Activity[],
): TrialRoad {
  const habitIds = new Set(activities.filter(isHabit).map((a) => a.id))
  const sessions = entries
    .filter(isSession)
    .filter((log) => habitIds.has(log.activityId))
  return computeTrialRoad(WORLD_TRIALS, sessions)
}

/**
 * Every coin a cleared trial has paid out, for the ledger replay.
 *
 * Like boss rewards, this is recomputed rather than banked, so a restored
 * backup lands on exactly the same balance.
 */
export function totalTrialRewards(
  entries: LogEntry[],
  activities: Activity[],
): number {
  const sessions = entries.filter(isSession)
  const buckets = logsByActivity(sessions)

  let total = 0
  for (const activity of activities) {
    if (!isHabit(activity)) continue
    const road = habitTrialRoad(buckets.get(activity.id) ?? [])
    for (const entry of road.trials) {
      if (entry.beaten) total += entry.trial.coinReward
    }
  }

  for (const entry of worldTrialRoad(entries, activities).trials) {
    if (entry.beaten) total += entry.trial.coinReward
  }
  return total
}

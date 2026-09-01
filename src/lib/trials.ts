import type { Activity, Id, LogEntry, SessionLogEntry } from '../types'
import { assetUrl } from './asset'
import { addDays } from './date'
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
 * Nothing here is stored. A trial is *cleared* when your longest run ever
 * reaches its day count — deliberately the best run rather than the current
 * one, so breaking a streak can never take a victory back.
 *
 * Clearing alone would make the road dead ground, though: pass seven days once
 * and The Gatekeeper is finished forever, with no reason to care about it
 * again. So the road has a second, living dimension. Each trial also counts how
 * many separate runs have reached it, and pays a smaller bounty every time you
 * get there again — and the road shows which trial your *current* streak holds
 * right now. Lapse and you drop that standing but keep every trophy and coin
 * already earned; rebuild and you climb back, and get paid for it.
 */

/** Share of a trial's first-clear reward paid for each later run that reaches it. */
const REPEAT_SHARE = 0.25

export interface Trial {
  id: Id
  name: string
  /** Consecutive days needed to beat it. */
  days: number
  /** Portrait art, prepared like the arena bosses. */
  art: string
  accent: string
  /** Coins paid out once, the first time it is cleared. */
  coinReward: number
}

/** Per-habit trials. Modest rewards — the point is the road, not the payout. */
export const HABIT_TRIALS: Trial[] = [
  { id: 'spark', name: 'First Spark', days: 3, art: assetUrl('/assets/trials/spark.png'), accent: '#58cc02', coinReward: 15 },
  { id: 'ember', name: 'Steady Ember', days: 7, art: assetUrl('/assets/trials/ember.png'), accent: '#ff9600', coinReward: 40 },
  { id: 'forge', name: 'The Forge', days: 14, art: assetUrl('/assets/trials/forge.png'), accent: '#c0803a', coinReward: 90 },
  { id: 'keep', name: 'The Long Keep', days: 30, art: assetUrl('/assets/trials/keep.png'), accent: '#1cb0f6', coinReward: 200 },
  { id: 'summit', name: 'The Summit', days: 60, art: assetUrl('/assets/trials/summit.png'), accent: '#ce82ff', coinReward: 450 },
  { id: 'eternal', name: 'The Eternal Watch', days: 100, art: assetUrl('/assets/trials/eternal.png'), accent: '#ffc800', coinReward: 900 },
]

/**
 * Overworld trials, driven by the streak across *every* habit. Rarer and worth
 * far more, because keeping any habit alive daily is the harder ask.
 */
export const WORLD_TRIALS: Trial[] = [
  { id: 'world-gate', name: 'The Gatekeeper', days: 7, art: assetUrl('/assets/trials/world-gate.png'), accent: '#4c8df6', coinReward: 120 },
  { id: 'world-warden', name: 'Warden of Days', days: 21, art: assetUrl('/assets/trials/world-warden.png'), accent: '#6c5ce7', coinReward: 350 },
  { id: 'world-crown', name: 'The Long Vigil', days: 50, art: assetUrl('/assets/trials/world-crown.png'), accent: '#ff5a2b', coinReward: 800 },
  { id: 'world-eternal', name: 'The Unbroken', days: 120, art: assetUrl('/assets/trials/world-eternal.png'), accent: '#ffc800', coinReward: 1800 },
  { id: 'world-myth', name: 'The Year-King', days: 365, art: assetUrl('/assets/trials/world-myth.png'), accent: '#ff3d6e', coinReward: 5000 },
]

export interface TrialProgress {
  trial: Trial
  beaten: boolean
  /** Separate streak runs that have reached this trial's day count. */
  times: number
  /** True when the run you are on right now satisfies this trial. */
  held: boolean
  /** Days still needed, from the current run. Zero once beaten. */
  remaining: number
  /** How far the current run has come toward this trial, 0–1. */
  fraction: number
  /** Everything this trial has paid out, first clear plus repeat bounties. */
  earned: number
}

export interface TrialRoad {
  /** Best run ever, which is what decides victories. */
  longest: number
  /** The run in progress, which is what the bars fill with. */
  current: number
  trials: TrialProgress[]
  /** The next trial still to beat, or undefined once the road is finished. */
  next?: TrialProgress
  /** The highest trial the current run satisfies — the standing you hold now. */
  held?: TrialProgress
  /** The trial to rebuild toward after a lapse, when one has been lost. */
  regain?: TrialProgress
  beatenCount: number
}

/**
 * The length of every streak run in the log.
 *
 * A run is a block of consecutive days; the list is what lets a trial count how
 * many separate times it has been reached rather than merely whether it ever
 * was.
 */
export function streakRuns(logs: SessionLogEntry[]): number[] {
  const days = [...new Set(logs.map((log) => log.day))].sort()
  const runs: number[] = []
  let previous: string | null = null

  for (const day of days) {
    if (previous !== null && addDays(previous, 1) === day) {
      runs[runs.length - 1] += 1
    } else {
      runs.push(1)
    }
    previous = day
  }
  return runs
}

/** What a trial has paid in total for `times` separate runs reaching it. */
export function trialPayout(trial: Trial, times: number): number {
  if (times <= 0) return 0
  const repeat = Math.round(trial.coinReward * REPEAT_SHARE)
  return trial.coinReward + (times - 1) * repeat
}

/** The bounty the next re-clear of this trial would pay. */
export function repeatBounty(trial: Trial): number {
  return Math.round(trial.coinReward * REPEAT_SHARE)
}

/** Walks a ladder of trials against one streak. */
export function computeTrialRoad(
  ladder: Trial[],
  logs: SessionLogEntry[],
): TrialRoad {
  const streak = computeStreak(logs)
  const runs = streakRuns(logs)

  const trials = ladder.map((trial) => {
    const beaten = streak.longest >= trial.days
    const times = runs.filter((run) => run >= trial.days).length
    return {
      trial,
      beaten,
      times,
      held: streak.current >= trial.days,
      remaining: Math.max(0, trial.days - streak.current),
      fraction: Math.min(1, streak.current / trial.days),
      earned: trialPayout(trial, times),
    }
  })

  // The highest rung the current run stands on, and the first cleared one it
  // has fallen below — what there is to win back.
  const held = [...trials].reverse().find((entry) => entry.held)
  const regain = trials.find((entry) => entry.beaten && !entry.held)

  return {
    longest: streak.longest,
    current: streak.current,
    trials,
    next: trials.find((entry) => !entry.beaten),
    held,
    regain,
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
    for (const entry of road.trials) total += entry.earned
  }

  for (const entry of worldTrialRoad(entries, activities).trials) {
    total += entry.earned
  }
  return total
}

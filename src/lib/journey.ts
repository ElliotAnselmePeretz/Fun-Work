import type { Activity, ActivityProgress, Level } from '../types'
import { levelState, type LevelState } from './xp'

/**
 * A stretch of the route. Chapters exist only to give a long ladder a sense of
 * place — they are derived from the level count, never stored, so editing an
 * activity's levels re-chapters it immediately and consistently.
 */
export interface Chapter {
  id: string
  name: string
  /** Sets the section's background wash. Node colours stay the category's. */
  accent: string
}

export const CHAPTERS: Chapter[] = [
  { id: 'green-hollow', name: 'Green Hollow', accent: '#58cc02' },
  { id: 'stoneford', name: 'Stoneford', accent: '#1cb0f6' },
  { id: 'ember-ridge', name: 'Ember Ridge', accent: '#ff9600' },
  { id: 'frostfall-pass', name: 'Frostfall Pass', accent: '#5ce1e6' },
  { id: 'sunspire-keep', name: 'Sunspire Keep', accent: '#ffc800' },
  { id: 'starfall-reach', name: 'Starfall Reach', accent: '#ce82ff' },
]

/** Roughly this many levels per chapter, until we run out of chapters. */
const LEVELS_PER_CHAPTER = 4

export function chapterCountFor(levelCount: number): number {
  if (levelCount <= 0) return 0
  const wanted = Math.ceil(levelCount / LEVELS_PER_CHAPTER)
  return Math.min(Math.max(wanted, 1), CHAPTERS.length)
}

/** Which chapter a level belongs to. Spreads levels evenly across chapters. */
export function chapterIndexFor(levelIndex: number, levelCount: number): number {
  const count = chapterCountFor(levelCount)
  if (count === 0) return 0
  return Math.min(count - 1, Math.floor((levelIndex * count) / levelCount))
}

/**
 * Horizontal offset for a node, in units of "one step from the centre".
 * The repeating wave is what turns a list into a winding route.
 */
const WAVE = [0, 1, 2, 1, 0, -1, -2, -1]

export function offsetFor(levelIndex: number): number {
  return WAVE[levelIndex % WAVE.length]
}

export interface JourneyStop {
  level: Level
  index: number
  state: LevelState
  offset: number
  /** True for the last stop of its chapter — drawn as a landmark. */
  isChapterEnd: boolean
}

export interface JourneySection {
  chapter: Chapter
  stops: JourneyStop[]
  /** Every stop cleared. */
  cleared: boolean
  /** Holds the level currently being worked on. */
  active: boolean
}

/** The whole route, grouped into chapters, ready to render. */
export function buildJourney(
  activity: Activity,
  progress: ActivityProgress,
): JourneySection[] {
  const levelCount = activity.levels.length
  if (levelCount === 0) return []

  const sections: JourneySection[] = []
  activity.levels.forEach((level, index) => {
    const chapter = CHAPTERS[chapterIndexFor(index, levelCount)]
    let section = sections.at(-1)
    if (!section || section.chapter.id !== chapter.id) {
      section = { chapter, stops: [], cleared: false, active: false }
      sections.push(section)
    }
    const state = levelState(index, progress)
    section.stops.push({
      level,
      index,
      state,
      offset: offsetFor(index),
      isChapterEnd: false,
    })
  })

  for (const section of sections) {
    section.stops[section.stops.length - 1].isChapterEnd = true
    section.cleared = section.stops.every((stop) => stop.state === 'done')
    section.active = section.stops.some((stop) => stop.state === 'current')
  }
  return sections
}

export interface JourneySummary {
  chaptersCleared: number
  chapterTotal: number
  /** Where the traveller is now, or undefined once the route is finished. */
  currentChapter?: Chapter
  levelsCleared: number
  levelTotal: number
}

/** A one-line "where am I" read-out for the activity header. */
export function summarizeJourney(
  activity: Activity,
  progress: ActivityProgress,
): JourneySummary {
  const sections = buildJourney(activity, progress)
  return {
    chaptersCleared: sections.filter((section) => section.cleared).length,
    chapterTotal: sections.length,
    currentChapter: sections.find((section) => section.active)?.chapter,
    levelsCleared: Math.min(progress.currentLevelIndex, activity.levels.length),
    levelTotal: activity.levels.length,
  }
}

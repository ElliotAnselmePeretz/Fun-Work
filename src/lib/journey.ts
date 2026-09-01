import type { Activity, ActivityProgress, Level } from '../types'
import { assetUrl } from './asset'
import { levelState, type LevelState } from './xp'

/**
 * A stretch of the route. Chapters exist only to give a long ladder a sense of
 * place — they are derived from the level count, never stored, so editing an
 * activity's levels re-chapters it immediately and consistently.
 */
export interface Chapter {
  id: string
  name: string
  /** Tints the banner and the section's glow. Node colours stay the category's. */
  accent: string
  /** Seamless terrain tile laid under the section. See public/assets/areas. */
  terrain: string
  /** Re-colours a terrain family into a distinct later-game biome. */
  terrainFilter?: string
  /** Changes the repeat rhythm so related terrain families do not look cloned. */
  terrainSize?: string
}

const terrain = (id: string) => assetUrl(`/assets/areas/${id}.png`)

export const CHAPTERS: Chapter[] = [
  {
    id: 'green-hollow',
    name: 'Green Hollow',
    accent: '#58cc02',
    terrain: terrain('green-hollow'),
  },
  {
    id: 'stoneford',
    name: 'Stoneford',
    accent: '#a9825c',
    terrain: terrain('stoneford'),
  },
  {
    id: 'ember-ridge',
    name: 'Amber Ridge',
    accent: '#ff6a00',
    terrain: terrain('ember-ridge'),
  },
  {
    id: 'frostfall-pass',
    name: 'Frostfall Pass',
    accent: '#3fb8e0',
    terrain: terrain('frostfall-pass'),
  },
  {
    id: 'sunspire-keep',
    name: 'Sunspire Keep',
    accent: '#e0a020',
    terrain: terrain('sunspire-keep'),
  },
  {
    id: 'starfall-reach',
    name: 'Starfall Reach',
    accent: '#a05cf0',
    terrain: terrain('starfall-reach'),
  },
  {
    id: 'mistfen-marsh',
    name: 'Mistfen Marsh',
    accent: '#49c998',
    terrain: terrain('green-hollow'),
    terrainFilter: 'hue-rotate(54deg) saturate(0.82) brightness(0.68)',
    terrainSize: '224px 224px',
  },
  {
    id: 'moonstone-coast',
    name: 'Moonstone Coast',
    accent: '#55d6ff',
    terrain: terrain('frostfall-pass'),
    terrainFilter: 'hue-rotate(28deg) saturate(1.45) brightness(0.82)',
    terrainSize: '304px 304px',
  },
  {
    id: 'gloamwood-ruins',
    name: 'Gloamwood Ruins',
    accent: '#927cff',
    terrain: terrain('stoneford'),
    terrainFilter: 'hue-rotate(238deg) saturate(0.74) brightness(0.56)',
    terrainSize: '232px 232px',
  },
  {
    id: 'obsidian-vault',
    name: 'Obsidian Vault',
    accent: '#b598ff',
    terrain: terrain('stoneford'),
    terrainFilter: 'grayscale(0.75) contrast(1.5) brightness(0.4)',
    terrainSize: '192px 192px',
  },
  {
    id: 'crimson-rift',
    name: 'Crimson Rift',
    accent: '#ff4d6d',
    terrain: terrain('ember-ridge'),
    terrainFilter:
      'hue-rotate(325deg) saturate(1.45) contrast(1.18) brightness(0.66)',
    terrainSize: '288px 288px',
  },
  {
    id: 'crown-of-dawn',
    name: 'Crown of Dawn',
    accent: '#ffd166',
    terrain: terrain('sunspire-keep'),
    terrainFilter: 'sepia(0.18) saturate(1.55) brightness(0.92)',
    terrainSize: '240px 240px',
  },
]

export function chapterCountFor(levelCount: number): number {
  if (levelCount <= 0) return 0
  // Short journeys visit one distinct biome per level: a three-level path is
  // exactly Green Hollow → Stoneford → Amber Ridge. Longer campaigns keep
  // opening new scenery without making every single stop a chapter.
  const wanted =
    levelCount <= 3
      ? levelCount
      : levelCount <= 6
        ? 4
        : levelCount <= 10
          ? 5
          : 5 + Math.ceil((levelCount - 10) / 3)
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

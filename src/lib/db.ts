import Dexie, { type EntityTable } from 'dexie'
import type { Activity, Badge, Category, LogEntry, Settings } from '../types'

/**
 * Local-first storage. IndexedDB is the single source of truth — React reads
 * it through Dexie's useLiveQuery, so any write re-renders whatever depends on
 * it without a separate cache to keep in sync.
 */
export class FunWorkDB extends Dexie {
  categories!: EntityTable<Category, 'id'>
  activities!: EntityTable<Activity, 'id'>
  logs!: EntityTable<LogEntry, 'id'>
  badges!: EntityTable<Badge, 'id'>
  settings!: EntityTable<Settings, 'id'>

  constructor() {
    super('fun-work')
    this.version(1).stores({
      categories: 'id, order, createdAt',
      activities: 'id, categoryId, order, createdAt',
      // `day` is indexed for streak/stat queries, `at` for recent-activity.
      logs: 'id, activityId, day, at',
      badges: 'id, kind, earnedAt',
      settings: 'id',
    })
  }
}

export const db = new FunWorkDB()

export const DEFAULT_SETTINGS: Settings = {
  id: 'singleton',
  dailyGoal: 1,
}

export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('singleton')) ?? DEFAULT_SETTINGS
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings()
  await db.settings.put({ ...current, ...patch, id: 'singleton' })
}

/** Wipe everything. Used by Settings → Reset. */
export async function clearAllData(): Promise<void> {
  await db.transaction(
    'rw',
    [db.categories, db.activities, db.logs, db.badges],
    async () => {
      await Promise.all([
        db.categories.clear(),
        db.activities.clear(),
        db.logs.clear(),
        db.badges.clear(),
      ])
    },
  )
}

export interface BackupFile {
  version: 1
  exportedAt: number
  categories: Category[]
  activities: Activity[]
  logs: LogEntry[]
  badges: Badge[]
}

export async function exportBackup(): Promise<BackupFile> {
  const [categories, activities, logs, badges] = await Promise.all([
    db.categories.toArray(),
    db.activities.toArray(),
    db.logs.toArray(),
    db.badges.toArray(),
  ])
  return { version: 1, exportedAt: Date.now(), categories, activities, logs, badges }
}

/** Replaces all data. The caller is responsible for confirming with the user. */
export async function importBackup(backup: BackupFile): Promise<void> {
  if (backup.version !== 1) {
    throw new Error(`Unsupported backup version: ${backup.version}`)
  }
  await db.transaction(
    'rw',
    [db.categories, db.activities, db.logs, db.badges],
    async () => {
      await clearAllData()
      await db.categories.bulkAdd(backup.categories)
      await db.activities.bulkAdd(backup.activities)
      await db.logs.bulkAdd(backup.logs)
      await db.badges.bulkAdd(backup.badges)
    },
  )
}

import { db } from '../../lib/db'
import { newId } from '../../lib/id'
import { nextOrder, ORDER_STEP } from '../../lib/ordering'
import { nextColor } from '../../lib/palette'
import { makeDefaultLevels } from '../../lib/xp'
import type { Activity, Category } from '../../types'
import type { ParsedCategory, ParseResult } from './parseBulkText'

export interface ImportSummary {
  categoriesCreated: number
  categoriesMerged: number
  activitiesCreated: number
  activitiesSkipped: number
}

/**
 * Commits a parsed list. Categories and activities that already exist by name
 * are merged into rather than duplicated, so pasting an updated version of the
 * same list is safe and doesn't wipe any logged history.
 */
export async function commitImport(result: ParseResult): Promise<ImportSummary> {
  const groups: ParsedCategory[] = [...result.categories]
  if (result.orphanActivities.length > 0) {
    groups.push({ name: 'Uncategorized', activities: result.orphanActivities })
  }

  const summary: ImportSummary = {
    categoriesCreated: 0,
    categoriesMerged: 0,
    activitiesCreated: 0,
    activitiesSkipped: 0,
  }

  await db.transaction('rw', [db.categories, db.activities], async () => {
    const existingCategories = await db.categories.toArray()
    const categoryByName = new Map(
      existingCategories.map((category) => [category.name.toLowerCase(), category]),
    )

    let categoryOrder = nextOrder(existingCategories)
    let paletteIndex = existingCategories.length

    const newCategories: Category[] = []
    const newActivities: Activity[] = []

    for (const group of groups) {
      let category = categoryByName.get(group.name.toLowerCase())

      if (category) {
        summary.categoriesMerged += 1
      } else {
        category = {
          id: newId(),
          name: group.name,
          // Left empty so the icon derives from the name, like every other
          // row. A leading emoji in the pasted text is only a name separator.
          emoji: '',
          color: nextColor(paletteIndex),
          order: categoryOrder,
          createdAt: Date.now(),
        }
        categoryOrder += ORDER_STEP
        paletteIndex += 1
        newCategories.push(category)
        categoryByName.set(category.name.toLowerCase(), category)
        summary.categoriesCreated += 1
      }

      const siblings = await db.activities
        .where('categoryId')
        .equals(category.id)
        .toArray()
      const takenNames = new Set(
        siblings.map((activity) => activity.name.toLowerCase()),
      )
      let activityOrder = nextOrder(siblings)

      for (const parsed of group.activities) {
        if (takenNames.has(parsed.name.toLowerCase())) {
          summary.activitiesSkipped += 1
          continue
        }
        takenNames.add(parsed.name.toLowerCase())
        newActivities.push({
          id: newId(),
          categoryId: category.id,
          name: parsed.name,
          emoji: '',
          levels: makeDefaultLevels(),
          order: activityOrder,
          createdAt: Date.now(),
        })
        activityOrder += ORDER_STEP
        summary.activitiesCreated += 1
      }
    }

    if (newCategories.length > 0) await db.categories.bulkAdd(newCategories)
    if (newActivities.length > 0) await db.activities.bulkAdd(newActivities)
  })

  return summary
}

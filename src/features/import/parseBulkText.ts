/**
 * Parses the plain-text bulk format:
 *
 *   # Physical
 *   Running
 *   Swimming
 *
 *   # Schoolwork
 *   Math AA
 *
 * A line starting with "# " opens a category; every non-blank line under it is
 * an activity in that category. Blank lines are ignored, so pasting something
 * loosely formatted still works.
 */

export interface ParsedActivity {
  name: string
  /** A leading emoji found in the line, split off from the name. */
  emoji?: string
}

export interface ParsedCategory {
  name: string
  emoji?: string
  activities: ParsedActivity[]
}

export interface ParseResult {
  categories: ParsedCategory[]
  /** Activity lines that appeared before any "# " heading. */
  orphanActivities: ParsedActivity[]
  warnings: string[]
}

/** Matches a leading emoji (plus optional variation selector) and the rest. */
const LEADING_EMOJI =
  /^(\p{Extended_Pictographic}(?:️)?(?:‍\p{Extended_Pictographic}(?:️)?)*)\s*(.*)$/u

/** Bullet and list markers people paste in without thinking about it. */
const LIST_MARKER = /^[-*•·–—]\s+|^\d+[.)]\s+/

function splitEmoji(raw: string): { name: string; emoji?: string } {
  const match = LEADING_EMOJI.exec(raw)
  if (match && match[2].trim()) {
    return { emoji: match[1], name: match[2].trim() }
  }
  return { name: raw.trim() }
}

export function parseBulkText(input: string): ParseResult {
  const categories: ParsedCategory[] = []
  const orphanActivities: ParsedActivity[] = []
  const warnings: string[] = []
  const seenCategories = new Map<string, ParsedCategory>()

  let current: ParsedCategory | null = null

  for (const rawLine of input.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    if (line.startsWith('#')) {
      const heading = line.replace(/^#+\s*/, '').trim()
      if (!heading) {
        warnings.push('Skipped a "#" line with no category name.')
        continue
      }

      const { name, emoji } = splitEmoji(heading)
      const key = name.toLowerCase()
      const existing = seenCategories.get(key)
      if (existing) {
        // Re-opening a heading merges rather than creating a duplicate.
        warnings.push(`"${name}" appears more than once — merged into one category.`)
        current = existing
        continue
      }

      current = { name, ...(emoji ? { emoji } : {}), activities: [] }
      seenCategories.set(key, current)
      categories.push(current)
      continue
    }

    const cleaned = line.replace(LIST_MARKER, '').trim()
    if (!cleaned) continue

    const { name, emoji } = splitEmoji(cleaned)
    const activity: ParsedActivity = { name, ...(emoji ? { emoji } : {}) }
    const target = current ? current.activities : orphanActivities

    if (target.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      warnings.push(
        `"${name}" is listed twice${current ? ` under ${current.name}` : ''} — kept once.`,
      )
      continue
    }
    target.push(activity)
  }

  if (orphanActivities.length > 0) {
    warnings.push(
      `${orphanActivities.length} line${orphanActivities.length === 1 ? '' : 's'} came before any "# " heading — they'll go into a category called "Uncategorized".`,
    )
  }

  return { categories, orphanActivities, warnings }
}

export function countActivities(result: ParseResult): number {
  return (
    result.categories.reduce((sum, category) => sum + category.activities.length, 0) +
    result.orphanActivities.length
  )
}

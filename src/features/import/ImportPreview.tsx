import { Card } from '../../components/Card'
import { nextColor, withAlpha } from '../../lib/palette'
import type { Activity, Category } from '../../types'
import { countActivities, type ParseResult } from './parseBulkText'
import { AvatarIcon } from '../../components/AvatarIcon'

interface ImportPreviewProps {
  result: ParseResult
  existingCategories: Category[]
  existingActivities: Activity[]
}

/**
 * Shows exactly what will happen before anything is written — including which
 * categories merge into ones that already exist and which activities are
 * duplicates that will be skipped, so the preview can't promise more than the
 * import delivers.
 */
export function ImportPreview({
  result,
  existingCategories,
  existingActivities,
}: ImportPreviewProps) {
  const groups = [
    ...result.categories,
    ...(result.orphanActivities.length > 0
      ? [
          {
            name: 'Uncategorized',
            emoji: undefined,
            activities: result.orphanActivities,
          },
        ]
      : []),
  ]

  if (groups.length === 0) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-swan px-4 py-6 text-center text-sm text-ink-soft">
        Nothing to import yet — paste a list above.
      </p>
    )
  }

  const existingByName = new Map(
    existingCategories.map((category) => [category.name.toLowerCase(), category]),
  )
  // Mirrors commitImport's palette walk so preview colors match the result.
  let paletteIndex = existingCategories.length

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold text-ink-soft">
        {groups.length} categor{groups.length === 1 ? 'y' : 'ies'} ·{' '}
        {countActivities(result)} activit
        {countActivities(result) === 1 ? 'y' : 'ies'}
      </p>

      {result.warnings.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-2xl border-2 border-gold/50 bg-gold/10 px-4 py-3">
          {result.warnings.map((warning) => (
            <li key={warning} className="text-xs font-bold text-ink">
              {warning}
            </li>
          ))}
        </ul>
      )}

      {groups.map((group) => {
        const existing = existingByName.get(group.name.toLowerCase())
        const color = existing?.color ?? nextColor(paletteIndex)
        if (!existing) paletteIndex += 1

        const taken = new Set(
          existingActivities
            .filter((activity) => activity.categoryId === existing?.id)
            .map((activity) => activity.name.toLowerCase()),
        )

        return (
          <Card key={group.name} className="overflow-hidden">
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{ backgroundColor: withAlpha(color, 0.15) }}
            >
              <AvatarIcon name={group.name} stored={existing?.emoji} />
              <span className="font-extrabold" style={{ color }}>
                {group.name}
              </span>
              {existing && (
                <span className="rounded-full bg-night/80 px-2 py-0.5 text-[10px] font-extrabold uppercase text-ink-soft">
                  merges
                </span>
              )}
              <span className="ml-auto text-xs font-bold text-ink-soft">
                {group.activities.length}
              </span>
            </div>

            {group.activities.length === 0 ? (
              <p className="px-3 py-2 text-xs text-ink-soft">No activities listed.</p>
            ) : (
              <ul className="divide-y-2 divide-swan">
                {group.activities.map((activity) => {
                  const duplicate = taken.has(activity.name.toLowerCase())
                  return (
                    <li
                      key={activity.name}
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-bold ${
                        duplicate ? 'text-hare line-through' : ''
                      }`}
                    >
                      <AvatarIcon name={activity.name} />
                      <span className="min-w-0 flex-1 truncate">{activity.name}</span>
                      {duplicate && (
                        <span className="shrink-0 text-[10px] font-extrabold uppercase no-underline">
                          already there
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        )
      })}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ScreenHeader } from '../components/ScreenHeader'
import { TextArea } from '../components/TextField'
import { commitImport, type ImportSummary } from '../features/import/importActions'
import { ImportPreview } from '../features/import/ImportPreview'
import { countActivities, parseBulkText } from '../features/import/parseBulkText'
import { useActivities, useCategories } from '../hooks/useData'
import { navigate } from '../lib/router'

const EXAMPLE = `# 💪 Physical
Running
Swimming
Push-ups

# 📚 Schoolwork
Math AA
Physics HL
Extended Essay`

export function BulkAddScreen() {
  const categories = useCategories()
  const activities = useActivities()
  const [text, setText] = useState('')
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const result = useMemo(() => parseBulkText(text), [text])
  const total = countActivities(result)
  const canImport = result.categories.length > 0 || result.orphanActivities.length > 0

  const runImport = async () => {
    setSummary(await commitImport(result))
    setText('')
  }

  if (summary) {
    return (
      <div className="flex flex-col gap-5">
        <ScreenHeader back title="Imported" />
        <Card className="flex flex-col items-center gap-2 p-6 text-center">
          <span className="text-5xl animate-pop-in" aria-hidden>
            📥
          </span>
          <p className="text-lg font-extrabold">
            {summary.activitiesCreated} activit
            {summary.activitiesCreated === 1 ? 'y' : 'ies'} added
          </p>
          <p className="text-sm text-ink-soft">
            {summary.categoriesCreated} new categor
            {summary.categoriesCreated === 1 ? 'y' : 'ies'}
            {summary.categoriesMerged > 0 &&
              `, ${summary.categoriesMerged} merged into existing`}
            {summary.activitiesSkipped > 0 &&
              `, ${summary.activitiesSkipped} skipped as duplicate${
                summary.activitiesSkipped === 1 ? '' : 's'
              }`}
            .
          </p>
        </Card>
        <Button size="lg" onClick={() => navigate({ name: 'organize' })}>
          Reorder them
        </Button>
        <Button size="lg" variant="secondary" onClick={() => navigate({ name: 'home' })}>
          Back to home
        </Button>
        <Button variant="ghost" onClick={() => setSummary(null)}>
          Import another list
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader
        back
        title="Bulk add"
        subtitle="Paste a list — nothing is saved until you confirm"
      />

      <Card className="flex flex-col gap-2 p-4">
        <h2 className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">
          Format
        </h2>
        <p className="text-sm text-ink-soft">
          A line starting with <code className="font-bold text-ink"># </code> starts a
          category. Every line under it becomes an activity in that category. Bullets,
          numbering and leading emoji are handled for you.
        </p>
        <Button size="sm" variant="ghost" onClick={() => setText(EXAMPLE)}>
          Fill in an example
        </Button>
      </Card>

      <TextArea
        label="Your list"
        rows={10}
        value={text}
        placeholder={EXAMPLE}
        onChange={(event) => setText(event.target.value)}
      />

      <section>
        <h2 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
          Preview
        </h2>
        <ImportPreview
          result={result}
          existingCategories={categories ?? []}
          existingActivities={activities ?? []}
        />
      </section>

      <Button size="lg" onClick={runImport} disabled={!canImport}>
        {canImport ? `Import ${total} activit${total === 1 ? 'y' : 'ies'}` : 'Import'}
      </Button>
    </div>
  )
}

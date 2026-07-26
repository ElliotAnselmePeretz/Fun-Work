import { useState } from 'react'
import { PixelIcon } from '../components/PixelIcon'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { ScreenHeader } from '../components/ScreenHeader'
import { commitImport, type ImportSummary } from '../features/import/importActions'
import { ImportPreview } from '../features/import/ImportPreview'
import {
  extractListFromImage,
  MissingApiKeyError,
} from '../features/import/imageImport'
import { countActivities, type ParseResult } from '../features/import/parseBulkText'
import { useActivities, useCategories, useSettings } from '../hooks/useData'
import { navigate } from '../lib/router'

export function ImageImportScreen() {
  const categories = useCategories()
  const activities = useActivities()
  const settings = useSettings()

  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!settings) return null

  const onFile = async (file: File) => {
    setError(null)
    setResult(null)
    setPreview(URL.createObjectURL(file))
    setBusy(true)
    try {
      setResult(await extractListFromImage(file, settings.anthropicApiKey ?? ''))
    } catch (caught) {
      setError(
        caught instanceof MissingApiKeyError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : 'Could not read that image.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (summary) {
    return (
      <div className="flex flex-col gap-5">
        <ScreenHeader back title="Imported" />
        <Card className="flex flex-col items-center gap-2 p-6 text-center">
          <PixelIcon name="mirror" className="animate-pop-in h-14 w-14" />
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
      </div>
    )
  }

  if (!settings.anthropicApiKey) {
    return (
      <div className="flex flex-col gap-5">
        <ScreenHeader back title="Import from image" />
        <EmptyState
          icon="key"
          title="Needs an API key"
          description="Reading a list out of a photo uses Claude, so it needs your own Anthropic API key. Add one in Settings."
        >
          <Button size="lg" onClick={() => navigate({ name: 'settings' })}>
            Open settings
          </Button>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader
        back
        title="Import from image"
        subtitle="Nothing is saved until you confirm"
      />

      <label className="block">
        <span className="btn-3d block cursor-pointer bg-sky px-5 py-4 text-center text-sm font-extrabold uppercase tracking-wide text-white [--btn-edge:#1683b8]">
          {preview ? 'Choose a different image' : 'Choose an image'}
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void onFile(file)
            event.target.value = ''
          }}
        />
      </label>

      {preview && (
        <img
          src={preview}
          alt="The image being imported"
          className="max-h-64 w-full rounded-2xl border-2 border-swan object-contain"
        />
      )}

      {busy && (
        <Card className="flex items-center gap-3 p-4">
          <PixelIcon name="lamp" className="animate-flame h-7 w-7" />
          <span className="text-sm font-bold text-ink-soft">
            Reading the list out of your image…
          </span>
        </Card>
      )}

      {error && (
        <p className="rounded-2xl border-2 border-cardinal/40 bg-cardinal/5 px-4 py-3 text-sm font-bold text-ink">
          {error}
        </p>
      )}

      {result && (
        <>
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

          <Button
            size="lg"
            disabled={countActivities(result) === 0}
            onClick={async () => setSummary(await commitImport(result))}
          >
            Import {countActivities(result)} activit
            {countActivities(result) === 1 ? 'y' : 'ies'}
          </Button>
        </>
      )}
    </div>
  )
}

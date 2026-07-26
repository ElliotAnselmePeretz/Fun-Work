import { useState } from 'react'
import { PixelIcon } from '../../components/PixelIcon'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { TextField } from '../../components/TextField'
import { saveSettings } from '../../lib/db'
import type { Settings } from '../../types'

interface ApiKeyCardProps {
  settings: Settings
}

/**
 * The key lives only in this browser's IndexedDB and is sent straight to
 * Anthropic from the device. It is never committed, bundled, or proxied.
 */
export function ApiKeyCard({ settings }: ApiKeyCardProps) {
  const [draft, setDraft] = useState('')
  const [saved, setSaved] = useState(false)
  const hasKey = Boolean(settings.anthropicApiKey)

  const save = async () => {
    await saveSettings({ anthropicApiKey: draft.trim() || undefined })
    setDraft('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const clear = async () => {
    await saveSettings({ anthropicApiKey: undefined })
    setDraft('')
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="font-extrabold">Anthropic API key</h2>
      <p className="text-sm text-ink-soft">
        Optional. Only needed for importing a list from a photo or screenshot.
        Everything else works without it.
      </p>

      {hasKey ? (
        <div className="flex items-center gap-2 rounded-2xl border-2 border-grass/40 bg-grass/10 px-3 py-2">
          <PixelIcon name="key" className="h-5 w-5" />
          <span className="flex-1 text-sm font-extrabold">Key saved</span>
          <Button size="sm" variant="ghost" onClick={clear}>
            Remove
          </Button>
        </div>
      ) : (
        <>
          <TextField
            label="Key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="sk-ant-..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button onClick={save} disabled={!draft.trim()}>
            {saved ? 'Saved' : 'Save key'}
          </Button>
        </>
      )}

      <p className="text-xs text-ink-soft">
        Stored unencrypted in this browser and sent directly to Anthropic — anyone
        with access to this device can read it. Use a key scoped to just this, and
        remove it here when you're done.
      </p>
    </Card>
  )
}

import { useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PixelIcon } from '../components/PixelIcon'
import { ScreenHeader } from '../components/ScreenHeader'
import { ApiKeyCard } from '../features/settings/ApiKeyCard'
import { StatsSummary } from '../features/settings/StatsSummary'
import {
  useActivities,
  useBadges,
  useCategories,
  useCoinSummary,
  useLedgerEntries,
  useLogs,
  useSettings,
  useStreak,
} from '../hooks/useData'
import { clearAllData, exportBackup, importBackup, type BackupFile } from '../lib/db'
import { navigate } from '../lib/router'

export function SettingsScreen() {
  const categories = useCategories()
  const logs = useLogs()
  const badges = useBadges()
  const settings = useSettings()
  const activities = useActivities()
  const ledger = useLedgerEntries()
  const coins = useCoinSummary()
  const streak = useStreak()
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const download = async () => {
    const backup = await exportBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fun-work-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const restore = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as BackupFile
      await importBackup(parsed)
      setMessage('Backup restored.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not read that file.')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader title="Settings" subtitle="Your data, your numbers" />

      {activities && ledger && coins && streak && (
        <StatsSummary
          activities={activities}
          ledger={ledger}
          coins={coins}
          streak={streak}
          badgeCount={badges?.length ?? 0}
        />
      )}

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="flex items-center gap-2 font-extrabold">
          <PixelIcon name="chest" className="h-5 w-5" />
          Backup
        </h2>
        <p className="text-sm text-ink-soft">
          {categories?.length ?? 0} categories · {logs?.length ?? 0} sessions ·{' '}
          {badges?.length ?? 0} badges.
        </p>
        <p className="settings-warning">
          Everything lives in this browser and nothing is uploaded — so clearing
          your browser data would erase all of it. Export a file to keep a copy.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={download}>
            Export
          </Button>
          <label className="flex-1">
            <span className="btn-3d block cursor-pointer bg-sky px-5 py-3 text-center text-sm text-white [--btn-edge:#1683b8]">
              Import
            </span>
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void restore(file)
                event.target.value = ''
              }}
            />
          </label>
        </div>
        {message && <p className="text-sm font-bold text-ink-soft">{message}</p>}
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="flex items-center gap-2 font-extrabold">
          <PixelIcon name="scroll" className="h-5 w-5" />
          Add in bulk
        </h2>
        <p className="text-sm text-ink-soft">
          Paste a plain-text list to create many categories and activities at once.
        </p>
        <Button variant="secondary" onClick={() => navigate({ name: 'bulk-add' })}>
          Open bulk add
        </Button>
        <Button variant="secondary" onClick={() => navigate({ name: 'image-add' })}>
          Import from an image
        </Button>
      </Card>

      {settings && <ApiKeyCard settings={settings} />}

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="flex items-center gap-2 font-extrabold text-cardinal">
          <PixelIcon name="flame" className="h-5 w-5" />
          Danger zone
        </h2>
        {confirmingReset ? (
          <>
            <p className="text-sm font-bold">
              Delete every category, activity, log and badge? This cannot be undone —
              export a backup first if you want one.
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setConfirmingReset(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={async () => {
                  await clearAllData()
                  setConfirmingReset(false)
                  setMessage('All data cleared.')
                }}
              >
                Erase everything
              </Button>
            </div>
          </>
        ) : (
          <Button variant="danger" onClick={() => setConfirmingReset(true)}>
            Reset all data
          </Button>
        )}
      </Card>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { GameIcon } from '../components/GameIcon'
import { ProgressBar } from '../components/ProgressBar'
import { ScreenHeader } from '../components/ScreenHeader'
import { attackBoss } from '../features/arena/arenaActions'
import { useCoinSummary, useLedgerEntries } from '../hooks/useData'
import { computeBossProgress } from '../lib/bosses'
import { navigate } from '../lib/router'
import { ownedWeapons } from '../lib/shop'

export function ArenaScreen() {
  const ledger = useLedgerEntries()
  const coins = useCoinSummary()
  const [selectedBossId, setSelectedBossId] = useState<string | null>(null)
  const [selectedWeaponId, setSelectedWeaponId] = useState('lucky-pouch')
  const [attacking, setAttacking] = useState(false)
  const [impactToken, setImpactToken] = useState(0)
  const [message, setMessage] = useState<string | null>(null)

  const bosses = useMemo(
    () => (ledger ? computeBossProgress(ledger) : undefined),
    [ledger],
  )

  if (!ledger || !coins || !bosses) return null

  const availableWeapons = ownedWeapons(coins.ownedItemIds)
  const activeBoss =
    bosses.find((progress) => progress.boss.id === selectedBossId) ??
    bosses.find((progress) => !progress.defeated && !progress.locked) ??
    bosses[bosses.length - 1]
  const weapon =
    availableWeapons.find((item) => item.id === selectedWeaponId) ??
    availableWeapons[0]
  const allDefeated = bosses.every((progress) => progress.defeated)

  const attack = async () => {
    if (!activeBoss || !weapon) return
    setAttacking(true)
    setMessage(null)
    setImpactToken((token) => token + 1)
    try {
      const result = await attackBoss(activeBoss.boss.id, weapon.id)
      setMessage(
        result.defeated
          ? `Boss defeated. ${result.coinReward} coins added to your ledger.`
          : `${weapon.name} dealt ${result.damage} damage.`,
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The attack failed.')
    } finally {
      setAttacking(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader
        title="Boss Arena"
        subtitle={`${bosses.filter((progress) => progress.defeated).length}/${bosses.length} bosses defeated`}
        action={
          <button
            className="coin-pill"
            onClick={() => navigate({ name: 'shop' })}
            aria-label={`${coins.balance} coins. Open Armory`}
          >
            <GameIcon name="coins" size={17} />
            {coins.balance.toLocaleString()}
          </button>
        }
      />

      <div className="boss-map" aria-label="Boss progression">
        {bosses.map((progress, index) => (
          <button
            key={progress.boss.id}
            type="button"
            disabled={progress.locked}
            onClick={() => setSelectedBossId(progress.boss.id)}
            aria-label={`${progress.boss.name}${progress.locked ? ', locked' : ''}`}
            className={`boss-map-node ${
              activeBoss?.boss.id === progress.boss.id ? 'boss-map-node-active' : ''
            } ${progress.defeated ? 'boss-map-node-cleared' : ''}`}
          >
            <span className="boss-map-index">{index + 1}</span>
            <GameIcon
              name={progress.locked ? 'lock' : progress.defeated ? 'check' : progress.boss.icon}
              size={18}
            />
          </button>
        ))}
      </div>

      {activeBoss && (
        <section
          key={`${activeBoss.boss.id}-${impactToken}`}
          className={`boss-stage ${attacking ? 'boss-stage-impact' : ''}`}
          style={{ '--boss-accent': activeBoss.boss.accent } as React.CSSProperties}
        >
          <div className="boss-stage-grid" aria-hidden />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="banner-kicker">
                {activeBoss.defeated ? 'Arena cleared' : 'Current encounter'}
              </p>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-white">
                {activeBoss.boss.name}
              </h2>
              <p className="mt-1 text-sm font-bold text-white/60">
                {activeBoss.boss.title}
              </p>
            </div>
            <div className="boss-emblem">
              <GameIcon name={activeBoss.boss.icon} size={42} strokeWidth={1.7} />
            </div>
          </div>

          <div className="relative z-10 mt-8">
            <div className="mb-2 flex justify-between text-xs font-black uppercase tracking-wide text-white/70">
              <span>{activeBoss.defeated ? 'Defeated' : 'Boss health'}</span>
              <span>{activeBoss.remainingHp}/{activeBoss.boss.maxHp} HP</span>
            </div>
            <ProgressBar
              value={activeBoss.defeated ? 1 : 1 - activeBoss.fraction}
              color={activeBoss.defeated ? '#58cc02' : activeBoss.boss.accent}
              label={`${activeBoss.boss.name} health`}
            />
            <div className="mt-3 flex items-center justify-between text-xs font-extrabold text-white/60">
              <span>{activeBoss.hitCount} successful strikes</span>
              <span>{activeBoss.boss.coinReward} coin reward</span>
            </div>
          </div>
          {attacking && <span className="sword-slash" aria-hidden />}
        </section>
      )}

      {message && (
        <p role="status" className="combat-message">
          <GameIcon name={activeBoss?.defeated ? 'trophy' : 'target'} size={18} />
          {message}
        </p>
      )}

      {!allDefeated && activeBoss && !activeBoss.defeated && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="section-kicker">Loadout</p>
              <h2 className="text-xl font-black">Choose your weapon</h2>
            </div>
            <button
              onClick={() => navigate({ name: 'shop' })}
              className="text-xs font-black text-violet"
            >
              Open Armory
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {availableWeapons.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedWeaponId(item.id)}
                className={`weapon-chip ${
                  weapon?.id === item.id ? 'weapon-chip-active' : ''
                }`}
              >
                <GameIcon name={item.icon} size={22} />
                <span className="min-w-0 text-left">
                  <span className="block truncate text-xs font-black">{item.name}</span>
                  <span className="block text-[10px] font-bold text-ink-soft">
                    {item.damage} damage
                  </span>
                </span>
              </button>
            ))}
          </div>

          <Button
            size="lg"
            className="mt-3 flex items-center justify-center gap-2"
            disabled={attacking}
            onClick={() => void attack()}
          >
            <GameIcon name="swords" size={21} />
            {attacking ? 'Striking…' : `Attack with ${weapon?.name}`}
          </Button>
        </section>
      )}

      {allDefeated && (
        <Card className="arena-complete p-6 text-center">
          <GameIcon name="trophy" className="mx-auto text-gold-dark" size={42} />
          <h2 className="mt-3 text-2xl font-black">Arena conquered</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Every boss has fallen. Keep building your habits while the next arena is
            prepared.
          </p>
        </Card>
      )}
    </div>
  )
}

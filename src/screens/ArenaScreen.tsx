import { useMemo, useState, type CSSProperties } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { GameIcon } from '../components/GameIcon'
import { ProgressBar } from '../components/ProgressBar'
import { ScreenHeader } from '../components/ScreenHeader'
import { attackBoss } from '../features/arena/arenaActions'
import { useCoinSummary, useLedgerEntries } from '../hooks/useData'
import { computeBossProgress } from '../lib/bosses'
import { navigate } from '../lib/router'
import { ownedArmour, ownedWeapons } from '../lib/shop'

export function ArenaScreen() {
  const ledger = useLedgerEntries()
  const coins = useCoinSummary()
  const [selectedBossId, setSelectedBossId] = useState<string | null>(null)
  const [selectedWeaponId, setSelectedWeaponId] = useState('lucky-pouch')
  const [selectedArmourId, setSelectedArmourId] = useState('traveler-guard')
  const [attacking, setAttacking] = useState(false)
  const [impactToken, setImpactToken] = useState(0)
  const [lastImpact, setLastImpact] = useState<'hit' | 'loss'>('hit')
  const [message, setMessage] = useState<string | null>(null)

  const bosses = useMemo(
    () => (ledger ? computeBossProgress(ledger) : undefined),
    [ledger],
  )

  if (!ledger || !coins || !bosses) return null

  const availableWeapons = ownedWeapons(coins.ownedItemIds)
  const availableArmour = ownedArmour(coins.ownedItemIds)
  const activeBoss =
    bosses.find((progress) => progress.boss.id === selectedBossId) ??
    bosses.find((progress) => !progress.defeated && !progress.locked) ??
    bosses[bosses.length - 1]
  const weapon =
    availableWeapons.find((item) => item.id === selectedWeaponId) ??
    availableWeapons[0]
  const lockedArmourId =
    activeBoss.attemptHits > 0 ? activeBoss.armourId : undefined
  const armour =
    availableArmour.find(
      (item) => item.id === (lockedArmourId ?? selectedArmourId),
    ) ?? availableArmour[0]
  const displayedPlayerMaxHp =
    activeBoss.attemptHits === 0
      ? 100 + (armour?.maxHpBonus ?? 0)
      : activeBoss.playerMaxHp
  const displayedPlayerHp =
    activeBoss.attemptHits === 0
      ? displayedPlayerMaxHp
      : activeBoss.playerHp
  const allDefeated = bosses.every((progress) => progress.defeated)

  const attack = async () => {
    if (!activeBoss || !weapon || !armour) return
    setAttacking(true)
    setMessage(null)
    setLastImpact('hit')
    setImpactToken((token) => token + 1)
    try {
      const result = await attackBoss(
        activeBoss.boss.id,
        weapon.id,
        armour.id,
      )
      if (result.lost) {
        setLastImpact('loss')
        setMessage(
          `${activeBoss.boss.name} defeated you. No coins were lost; attempt ${activeBoss.attemptNumber + 1} is ready.`,
        )
      } else if (result.defeated) {
        setMessage(
          `${activeBoss.boss.name} defeated. ${result.coinReward} coins added to your ledger.`,
        )
      } else {
        setMessage(
          `${result.critical ? 'Critical strike! ' : ''}${weapon.name} dealt ${result.playerDamage}; ${activeBoss.boss.name} returned ${result.bossDamage}.`,
        )
      }
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
            {progress.locked || progress.defeated ? (
              <GameIcon
                name={progress.locked ? 'lock' : 'check'}
                size={18}
              />
            ) : (
              <img src={progress.boss.art} alt="" className="boss-map-portrait" />
            )}
          </button>
        ))}
      </div>

      {activeBoss && (
        <section
          key={`${activeBoss.boss.id}-${impactToken}`}
          className={`boss-stage ${
            attacking ? 'boss-stage-impact' : ''
          } ${lastImpact === 'loss' ? 'boss-stage-loss' : ''}`}
          style={{ '--boss-accent': activeBoss.boss.accent } as CSSProperties}
        >
          <div className="boss-stage-grid" aria-hidden />
          <img
            src={activeBoss.boss.art}
            alt=""
            className="boss-art"
            aria-hidden="true"
          />
          <div className="relative z-10 max-w-[64%]">
            <p className="banner-kicker">
              {activeBoss.defeated
                ? 'Arena cleared'
                : `Attempt ${activeBoss.attemptNumber}`}
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-white">
              {activeBoss.boss.name}
            </h2>
            <p className="mt-1 text-sm font-bold text-white/60">
              {activeBoss.boss.title}
            </p>
          </div>

          <div className="boss-health-panel relative z-10 mt-16">
            <div className="health-row">
              <div className="mb-2 flex justify-between text-xs font-black uppercase tracking-wide text-white/70">
                <span>{activeBoss.defeated ? 'Defeated' : 'Boss health'}</span>
                <span>
                  {activeBoss.remainingHp}/{activeBoss.boss.maxHp} HP
                </span>
              </div>
              <ProgressBar
                value={activeBoss.defeated ? 0 : 1 - activeBoss.fraction}
                color={activeBoss.defeated ? '#58cc02' : activeBoss.boss.accent}
                label={`${activeBoss.boss.name} health`}
              />
            </div>
            {!activeBoss.defeated && (
              <div className="health-row mt-3">
                <div className="mb-2 flex justify-between text-xs font-black uppercase tracking-wide text-white/70">
                  <span>Your health</span>
                  <span>
                    {displayedPlayerHp}/{displayedPlayerMaxHp} HP
                  </span>
                </div>
                <ProgressBar
                  value={displayedPlayerHp / displayedPlayerMaxHp}
                  color="#58cc02"
                  label="Player health"
                />
              </div>
            )}
          </div>
          {attacking && <span className="sword-slash" aria-hidden />}
        </section>
      )}

      <div className="grid grid-cols-4 gap-2">
        <Card className="battle-stat">
          <GameIcon name="target" size={17} />
          <strong>{activeBoss.boss.attack}</strong>
          <span>Boss attack</span>
        </Card>
        <Card className="battle-stat">
          <GameIcon name="swords" size={17} />
          <strong>{activeBoss.hitCount}</strong>
          <span>Total turns</span>
        </Card>
        <Card className="battle-stat">
          <GameIcon name="shield" size={17} />
          <strong>{activeBoss.losses}</strong>
          <span>Defeats</span>
        </Card>
        <Card className="battle-stat">
          <GameIcon name="coins" size={17} />
          <strong>{activeBoss.boss.coinReward}</strong>
          <span>Reward</span>
        </Card>
      </div>

      {message && (
        <p
          role="status"
          className={`combat-message ${
            lastImpact === 'loss' ? 'combat-message-loss' : ''
          }`}
        >
          <GameIcon
            name={
              lastImpact === 'loss'
                ? 'shield'
                : activeBoss?.defeated
                  ? 'trophy'
                  : 'target'
            }
            size={18}
          />
          {message}
        </p>
      )}

      {!allDefeated && activeBoss && !activeBoss.defeated && (
        <section className="flex flex-col gap-4">
          <div>
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
                  <img src={item.image} alt="" className="loadout-weapon-art" />
                  <span className="min-w-0 text-left">
                    <span className="block truncate text-xs font-black">
                      {item.name}
                    </span>
                    <span className="block text-[10px] font-bold text-ink-soft">
                      {item.damage} damage · crit every {item.critEvery}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-black">Choose your armour</h3>
              {lockedArmourId && (
                <span className="loadout-lock">
                  <GameIcon name="lock" size={12} />
                  Locked for this attempt
                </span>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {availableArmour.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={lockedArmourId !== undefined}
                  onClick={() => setSelectedArmourId(item.id)}
                  className={`armour-chip ${
                    armour?.id === item.id ? 'armour-chip-active' : ''
                  }`}
                >
                  <span className="armour-chip-art">
                    <img src={item.image} alt="" />
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block truncate text-xs font-black">
                      {item.name}
                    </span>
                    <span className="block text-[10px] font-bold text-ink-soft">
                      {item.defense} guard · +{item.maxHpBonus} HP
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            className="flex items-center justify-center gap-2"
            disabled={attacking}
            onClick={() => void attack()}
          >
            <GameIcon name="swords" size={21} />
            {attacking ? 'Resolving turn…' : `Attack with ${weapon?.name}`}
          </Button>
          <p className="text-center text-[11px] font-bold text-ink-soft">
            The boss retaliates after every surviving hit. Critical strikes deal
            double damage; losing resets only the current attempt.
          </p>
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

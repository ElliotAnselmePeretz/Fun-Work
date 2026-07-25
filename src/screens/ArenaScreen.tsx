import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { GameIcon } from '../components/GameIcon'
import { ProgressBar } from '../components/ProgressBar'
import { ScreenHeader } from '../components/ScreenHeader'
import {
  SwingMeter,
  type SwingMeterHandle,
} from '../components/SwingMeter'
import { takeTurn } from '../features/arena/arenaActions'
import { useCoinSummary, useLedgerEntries } from '../hooks/useData'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import {
  BOSS_MOVES,
  computeBossProgress,
  type BossProgress,
  type CombatTurn,
  type StrikeTiming,
} from '../lib/bosses'
import { recommendLoadout } from '../lib/loadout'
import { navigate } from '../lib/router'
import { ownedArmour, ownedWeapons } from '../lib/shop'

export function ArenaScreen() {
  const ledger = useLedgerEntries()
  const coins = useCoinSummary()
  const reducedMotion = usePrefersReducedMotion()
  const meter = useRef<SwingMeterHandle | null>(null)
  const [selectedBossId, setSelectedBossId] = useState<string | null>(null)
  const [selectedWeaponId, setSelectedWeaponId] = useState('lucky-pouch')
  const [selectedArmourId, setSelectedArmourId] = useState('traveler-guard')
  const [resolving, setResolving] = useState(false)
  const [impactToken, setImpactToken] = useState(0)
  const [lastImpact, setLastImpact] = useState<'hit' | 'guard' | 'loss'>('hit')
  const [lastTiming, setLastTiming] = useState<StrikeTiming>()
  const [message, setMessage] = useState<string | null>(null)

  const bosses = useMemo(
    () => (ledger ? computeBossProgress(ledger) : undefined),
    [ledger],
  )

  const activeBoss =
    bosses &&
    (bosses.find((progress) => progress.boss.id === selectedBossId) ??
      bosses.find((progress) => !progress.defeated && !progress.locked) ??
      bosses[bosses.length - 1])

  // Ranking every owned kit is a pure replay, so it only needs redoing when the
  // boss or the collection changes — not on every swing of the meter.
  const advice = useMemo(
    () =>
      activeBoss && coins && !activeBoss.defeated && !activeBoss.locked
        ? recommendLoadout(activeBoss.boss, coins.ownedItemIds)
        : undefined,
    [activeBoss, coins],
  )

  if (!ledger || !coins || !bosses || !activeBoss) return null

  const availableWeapons = ownedWeapons(coins.ownedItemIds)
  const availableArmour = ownedArmour(coins.ownedItemIds)
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
    activeBoss.attemptHits === 0 ? displayedPlayerMaxHp : activeBoss.playerHp
  const allDefeated = bosses.every((progress) => progress.defeated)
  const inCombat = !activeBoss.defeated && !activeBoss.locked
  const nextMove = activeBoss.nextMove

  const play = async (action: 'strike' | 'guard') => {
    if (!activeBoss || !weapon || !armour) return
    const timing = action === 'strike' ? meter.current?.read() : undefined
    setResolving(true)
    setMessage(null)
    setLastImpact(action === 'guard' ? 'guard' : 'hit')
    setLastTiming(timing)
    setImpactToken((token) => token + 1)
    try {
      const result = await takeTurn({
        bossId: activeBoss.boss.id,
        weaponId: weapon.id,
        armourId: armour.id,
        action,
        timing,
      })
      if (result.lost) {
        setLastImpact('loss')
        setMessage(
          `${activeBoss.boss.name} defeated you. No coins were lost; attempt ${activeBoss.attemptNumber + 1} is ready.`,
        )
      } else if (result.defeated) {
        setMessage(
          `${activeBoss.boss.name} defeated. ${result.coinReward} coins added to your ledger.`,
        )
      } else if (action === 'guard') {
        setMessage(
          `You guarded. ${activeBoss.boss.name} got through for ${result.bossDamage}.${
            result.healing > 0 ? ` You restored ${result.healing} HP.` : ''
          }`,
        )
      } else {
        const drained =
          result.bossHealed > 0
            ? ` It drained back ${result.bossHealed} HP.`
            : ''
        const healed =
          result.healing > 0 ? ` You restored ${result.healing} HP.` : ''
        setMessage(
          `${result.critical ? 'Critical strike! ' : ''}${weapon.name} dealt ${result.playerDamage}; ${activeBoss.boss.name} returned ${result.bossDamage}.${drained}${healed}`,
        )
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The turn failed.')
    } finally {
      setResolving(false)
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
            aria-label={`${progress.boss.name}${
              progress.locked
                ? ', locked'
                : progress.defeated
                  ? ', defeated'
                  : ''
            }`}
            className={`boss-map-node ${
              activeBoss.boss.id === progress.boss.id
                ? 'boss-map-node-active'
                : ''
            } ${progress.defeated ? 'boss-map-node-cleared' : ''}`}
          >
            <span className="boss-map-index">{index + 1}</span>
            {progress.locked ? (
              <GameIcon name="lock" size={18} />
            ) : (
              <img
                src={progress.boss.art}
                alt=""
                className={`boss-map-portrait pixel-art ${
                  progress.defeated ? 'boss-map-portrait-defeated' : ''
                }`}
              />
            )}
            {progress.defeated && (
              <span className="boss-map-cleared-mark" aria-hidden>
                <GameIcon name="check" size={11} strokeWidth={4} />
              </span>
            )}
          </button>
        ))}
      </div>

      <section
        key={`${activeBoss.boss.id}-${impactToken}`}
        className={`boss-stage ${
          activeBoss.defeated ? 'boss-stage-defeated' : ''
        } ${resolving ? 'boss-stage-impact' : ''} ${
          lastImpact === 'loss' ? 'boss-stage-loss' : ''
        }`}
        style={{ '--boss-accent': activeBoss.boss.accent } as CSSProperties}
      >
        <div className="boss-stage-grid" aria-hidden />
        <img
          src={activeBoss.boss.art}
          alt=""
          className={`boss-art pixel-art ${
            activeBoss.defeated ? 'boss-art-fallen' : ''
          }`}
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-[62%]">
          <p className="banner-kicker">
            {activeBoss.defeated
              ? 'Arena cleared'
              : activeBoss.locked
                ? 'Locked'
                : `Attempt ${activeBoss.attemptNumber}`}
          </p>
          <h2 className="mt-1 text-3xl font-black leading-none tracking-tight text-white">
            {activeBoss.boss.name}
          </h2>
          <p className="mt-1.5 text-sm font-bold text-white/60">
            {activeBoss.boss.title}
          </p>
        </div>

        {inCombat && (
          <div className="boss-telegraph relative z-10">
            <div className="boss-phase">
              <span>Phase {activeBoss.phase.number}</span>
              <strong>{activeBoss.phase.name}</strong>
            </div>
            <div className="boss-telegraph-head">
              <GameIcon name={nextMove.icon} size={15} />
              <strong>{nextMove.name}</strong>
              <span className="boss-telegraph-label">Next</span>
            </div>
            <p className="boss-telegraph-hint">{nextMove.hint}</p>
            <ol className="boss-rotation" aria-hidden>
              {activeBoss.boss.pattern.map((kind, index) => (
                <li
                  key={`${kind}-${index}`}
                  className={`boss-rotation-step ${
                    index === activeBoss.nextMoveIndex
                      ? 'boss-rotation-step-next'
                      : ''
                  }`}
                  title={BOSS_MOVES[kind].name}
                >
                  <GameIcon name={BOSS_MOVES[kind].icon} size={11} />
                </li>
              ))}
            </ol>
          </div>
        )}

        {activeBoss.defeated && (
          <div className="boss-defeat-mark" aria-hidden>
            <GameIcon name="sword" size={34} strokeWidth={2.4} />
            <span>Fallen</span>
          </div>
        )}

        {activeBoss.defeated ? (
          <div className="boss-victory-panel relative z-10 mt-5">
            <span className="boss-victory-icon">
              <GameIcon name="trophy" size={20} />
            </span>
            <span>
              <strong>Victory secured</strong>
              <small>
                Reward claimed · {activeBoss.boss.coinReward} coins
              </small>
            </span>
            <GameIcon name="check" className="ml-auto text-grass" size={23} />
          </div>
        ) : (
          <div className="boss-health-panel relative z-10 mt-4">
            <div className="health-row">
              <div className="mb-2 flex justify-between text-xs font-black uppercase tracking-wide text-white/70">
                <span>Boss health</span>
                <span>
                  {activeBoss.remainingHp}/{activeBoss.boss.maxHp} HP
                </span>
              </div>
              <ProgressBar
                value={1 - activeBoss.fraction}
                color={activeBoss.boss.accent}
                label={`${activeBoss.boss.name} health`}
              />
            </div>
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
          </div>
        )}
        {resolving && lastImpact !== 'guard' && (
          <span className="sword-slash" aria-hidden />
        )}
        {resolving && lastImpact === 'guard' && (
          <span className="guard-flash" aria-hidden />
        )}
      </section>

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
                : activeBoss.defeated
                  ? 'trophy'
                  : 'target'
            }
            size={18}
          />
          {message}
        </p>
      )}

      {inCombat && (
        <section className="flex flex-col gap-4">
          <div className="turn-panel">
            <SwingMeter
              running={!resolving}
              handle={meter}
              accent={activeBoss.boss.accent}
              result={lastTiming}
            />
            <div className="turn-actions">
              <Button
                size="lg"
                className="flex items-center justify-center gap-2"
                disabled={resolving}
                onClick={() => void play('strike')}
              >
                <GameIcon name="swords" size={21} />
                {resolving ? 'Resolving…' : 'Strike'}
              </Button>
              <button
                type="button"
                className="guard-button"
                disabled={resolving}
                onClick={() => void play('guard')}
              >
                <GameIcon name="shield" size={19} />
                Guard
              </button>
            </div>
            <p className="turn-hint">
              Guarding deals no damage but blocks about 70% of the blow
              {reducedMotion ? '' : ' — worth it when a heavy one is telegraphed'}
              .
            </p>
          </div>

          {activeBoss.recentTurns.length > 0 && (
            <div className="battle-log">
              <p className="section-kicker">Battle log</p>
              <ol>
                {activeBoss.recentTurns.map((turn, index) => (
                  <TurnRow key={index} turn={turn} progress={activeBoss} />
                ))}
              </ol>
            </div>
          )}

          <div>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="section-kicker">Loadout</p>
                <h2 className="text-xl font-black text-world">
                  Choose your weapon
                </h2>
              </div>
              <button
                onClick={() => navigate({ name: 'shop' })}
                className="text-xs font-black text-beetle"
              >
                Open Armory
              </button>
            </div>

            {advice?.best && (
              <Card className="loadout-advice mb-3 flex items-center gap-3 p-3">
                <span className="advice-icon">
                  <GameIcon name={advice.needsBetterGear ? 'store' : 'target'} size={18} />
                </span>
                <p className="min-w-0 text-[11px] font-bold leading-snug text-ink-soft">
                  {advice.needsBetterGear ? (
                    <>
                      Nothing you own beats {activeBoss.boss.name} yet. Your best
                      kit is{' '}
                      <strong className="text-ink">{advice.best.weapon.name}</strong>{' '}
                      with{' '}
                      <strong className="text-ink">{advice.best.armour.name}</strong>
                      {' '}— keep logging sessions and upgrade in the Armory.
                    </>
                  ) : (
                    <>
                      Best owned kit:{' '}
                      <strong className="text-ink">{advice.best.weapon.name}</strong>{' '}
                      with{' '}
                      <strong className="text-ink">{advice.best.armour.name}</strong>{' '}
                      wins in about {advice.best.hitsToWin} turns
                      {advice.best.guardTurns > 0
                        ? `, guarding ${advice.best.guardTurns} of them`
                        : ''}
                      .
                    </>
                  )}
                </p>
                {!advice.needsBetterGear && (
                  <button
                    type="button"
                    className="advice-apply"
                    disabled={lockedArmourId !== undefined}
                    onClick={() => {
                      setSelectedWeaponId(advice.best!.weapon.id)
                      setSelectedArmourId(advice.best!.armour.id)
                    }}
                  >
                    Equip
                  </button>
                )}
              </Card>
            )}

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
                  <img
                    src={item.image}
                    alt=""
                    className={`loadout-weapon-art ${item.pixelArt ? 'pixel-art' : ''}`}
                  />
                  <span className="min-w-0 text-left">
                    <span className="block truncate text-xs font-black">
                      {item.name}
                    </span>
                    <span className="block text-[10px] font-bold text-ink-soft">
                      {item.damage} damage
                      {item.healing
                        ? ` · heals ${item.healing}`
                        : ` · crit every ${item.critEvery}`}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-black text-world">
                Choose your armour
              </h3>
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
                    <img
                      src={item.image}
                      alt=""
                      className={item.pixelArt ? 'pixel-art' : undefined}
                    />
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
        </section>
      )}

      {activeBoss.locked && (
        <Card className="p-6 text-center">
          <GameIcon name="lock" className="mx-auto text-hare" size={34} />
          <h2 className="mt-3 text-lg font-black">Not yet</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Clear the bosses before {activeBoss.boss.name} to open this fight.
          </p>
        </Card>
      )}

      {allDefeated && (
        <Card className="arena-complete p-6 text-center">
          <GameIcon name="trophy" className="mx-auto text-gold-dark" size={42} />
          <h2 className="mt-3 text-2xl font-black">Arena conquered</h2>
          <p className="mt-2 text-sm text-ink-soft">
            All ten bosses have fallen. Keep building your habits while the next
            arena is prepared.
          </p>
        </Card>
      )}
    </div>
  )
}

interface TurnRowProps {
  turn: CombatTurn
  progress: BossProgress
}

/** One line of the battle log, read straight off a replayed turn. */
function TurnRow({ turn, progress }: TurnRowProps) {
  const move = turn.move ? BOSS_MOVES[turn.move] : undefined
  const guarded = turn.action === 'guard'

  return (
    <li className={`battle-log-row ${turn.lost ? 'battle-log-row-loss' : ''}`}>
      <span className="battle-log-icon">
        <GameIcon name={guarded ? 'shield' : 'swords'} size={13} />
      </span>
      <span className="min-w-0 flex-1 truncate">
        {guarded ? (
          <>Guarded {move ? `the ${move.name.toLowerCase()}` : ''}</>
        ) : (
          <>
            {turn.critical ? 'Critical ' : ''}
            {turn.playerDamage} damage
            {turn.timing === 'perfect' ? ' (perfect)' : ''}
            {turn.timing === 'weak' ? ' (weak)' : ''}
            {turn.bossHealed > 0 ? ` · drained ${turn.bossHealed}` : ''}
          </>
        )}
      </span>
      <span className="battle-log-taken">
        {turn.lost
          ? `${progress.boss.name} won`
          : turn.bossDamage > 0
            ? `−${turn.bossDamage} HP`
            : 'Victory'}
      </span>
    </li>
  )
}

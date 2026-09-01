import { useState, type CSSProperties } from 'react'
import { assetUrl } from '../lib/asset'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { GameIcon } from '../components/GameIcon'
import { PixelIcon } from '../components/PixelIcon'
import { ScreenHeader } from '../components/ScreenHeader'
import { purchaseItem } from '../features/shop/shopActions'
import { useCoinSummary, useStreak } from '../hooks/useData'
import { multiplierLabel, nextCoinMultiplier } from '../lib/coins'
import { navigate } from '../lib/router'
import {
  isItemOwned,
  SHOP_ITEMS,
  type GearType,
  type ShopItem,
} from '../lib/shop'

const FILTER_DETAILS: Record<
  GearType,
  { label: string; eyebrow: string; description: string }
> = {
  weapon: {
    label: 'Weapons',
    eyebrow: 'Pure offence',
    description: 'Higher damage and predictable critical strikes for shorter fights.',
  },
  magic: {
    label: 'Magic',
    eyebrow: 'Damage + recovery',
    description: 'Lower damage, then healing after any counterattack you survive.',
  },
  armour: {
    label: 'Armour',
    eyebrow: 'Survivability',
    description: 'Reduce every counterattack and begin each attempt with more health.',
  },
  relic: {
    label: 'Relics',
    eyebrow: 'Rule-changing side-grades',
    description:
      'Change how you fight with timing, recovery, rhythm, or comeback perks—each with a tradeoff.',
  },
}

export function ShopScreen() {
  const coins = useCoinSummary()
  const streak = useStreak()
  const [filter, setFilter] = useState<GearType>('weapon')
  const [buying, setBuying] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  if (!coins || !streak) return null

  const ownedCount = SHOP_ITEMS.filter((item) =>
    isItemOwned(item, coins.ownedItemIds),
  ).length
  const visibleItems = SHOP_ITEMS.filter((item) => item.gearType === filter)
  const visibleOwned = visibleItems.filter((item) =>
    isItemOwned(item, coins.ownedItemIds),
  ).length
  const filterDetails = FILTER_DETAILS[filter]

  const buy = async (itemId: string) => {
    setBuying(itemId)
    setMessage(null)
    try {
      await purchaseItem(itemId)
      const item = SHOP_ITEMS.find((candidate) => candidate.id === itemId)
      setMessage(`${item?.name ?? 'Gear'} unlocked and ready for the arena.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not buy that gear.')
    } finally {
      setBuying(null)
    }
  }

  return (
    <div className="screen-armory flex flex-col gap-5">
      <ScreenHeader
        title="The Armory"
        subtitle={`${ownedCount}/${SHOP_ITEMS.length} gear pieces unlocked`}
      />

      <section className="armory-banner armory-banner-rebuilt">
        <div className="banner-grid" aria-hidden />
        <div className="relative z-10 max-w-[58%]">
          <p className="banner-kicker">Forge a better build</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-white">
            Choose how you survive.
          </h2>
          <p className="mt-2 text-sm font-bold leading-relaxed text-white/65">
            Strike hard, recover with magic, absorb the counterattack, or bend
            the rules with a relic.
          </p>
          <Button
            size="sm"
            className="mt-5 inline-flex items-center gap-2"
            onClick={() => navigate({ name: 'arena' })}
          >
            <GameIcon name="swords" size={17} />
            Enter Arena
          </Button>
        </div>
        <div className="armory-showcase" aria-hidden="true">
          <span className="showcase-item showcase-item-back">
            <img src={assetUrl("/assets/gear/armour/dragon-plate.png")} alt="" />
          </span>
          <span className="showcase-item showcase-item-middle">
            <img src={assetUrl("/assets/gear/magic/crystal-staff.png")} alt="" />
          </span>
          <span className="showcase-item showcase-item-front">
            <img src={assetUrl("/assets/gear/weapons/voidbreaker.png")} alt="" />
          </span>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <Card className="mini-stat">
          <PixelIcon name="coin" className="h-5 w-5" />
          <strong>{coins.balance.toLocaleString()}</strong>
          <span>Available</span>
        </Card>
        <Card className="mini-stat">
          <GameIcon name="trophy" size={18} className="text-violet" />
          <strong>{coins.bossEarned.toLocaleString()}</strong>
          <span>Battle coins</span>
        </Card>
        <Card className="mini-stat">
          <GameIcon name="flame" size={18} className="text-flame" />
          <strong>{multiplierLabel(nextCoinMultiplier(streak))}</strong>
          <span>Next boost</span>
        </Card>
      </div>

      {message && (
        <p role="status" className="status-banner">
          <GameIcon name="check" size={18} />
          {message}
        </p>
      )}

      <section>
        <div className="gear-category-tabs" aria-label="Gear category">
          {(Object.keys(FILTER_DETAILS) as GearType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              aria-pressed={filter === type}
              className={filter === type ? 'gear-category-tab-active' : ''}
            >
              <PixelIcon
                name={
                  type === 'weapon'
                    ? 'swords'
                    : type === 'magic'
                      ? 'staff'
                      : type === 'armour'
                        ? 'shield'
                        : 'amulet'
                }
                className="h-5 w-5"
              />
              {FILTER_DETAILS[type].label}
            </button>
          ))}
        </div>

        <div className="gear-category-intro">
          <div>
            <p className="section-kicker">{filterDetails.eyebrow}</p>
            <h2 className="text-world text-xl font-black">{filterDetails.label}</h2>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-white/60">
              {filterDetails.description}
            </p>
          </div>
          <span className="collection-count">
            {visibleOwned}/{visibleItems.length} owned
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {visibleItems.map((item, index) => {
            const owned = isItemOwned(item, coins.ownedItemIds)
            const affordable = coins.balance >= item.cost
            return (
              <GearCard
                key={item.id}
                item={item}
                index={index}
                owned={owned}
                affordable={affordable}
                buying={buying === item.id}
                buyingDisabled={buying !== null}
                onBuy={() => void buy(item.id)}
              />
            )
          })}
        </div>
      </section>

      <Card className="loadout-advice p-4">
        <div className="flex items-start gap-3">
          <div className="weapon-icon">
            <GameIcon name="target" size={25} />
          </div>
          <div>
            <h3 className="font-black">How the balance works</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Weapons finish fights fastest. Magic heals only after you survive a
              counterattack, so armour still matters. A finishing blow prevents
              retaliation entirely.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

interface GearCardProps {
  item: ShopItem
  index: number
  owned: boolean
  affordable: boolean
  buying: boolean
  buyingDisabled: boolean
  onBuy: () => void
}

function GearCard({
  item,
  index,
  owned,
  affordable,
  buying,
  buyingDisabled,
  onBuy,
}: GearCardProps) {
  const power = gearPower(item)

  return (
    <Card
      className={`gear-card stagger-in gear-card-${item.gearType} ${
        owned ? 'gear-card-owned' : ''
      } ${affordable && !owned ? 'gear-card-affordable' : ''} ${
        buying ? 'gear-card-buying' : ''
      }`}
      style={{ '--stagger': `${Math.min(index, 12) * 45}ms` } as CSSProperties}
    >
      <div className="gear-card-visual">
        <span className="gear-rank">{String(index + 1).padStart(2, '0')}</span>
        <img
          src={item.image}
          alt={item.name}
          className={item.pixelArt ? 'pixel-art' : undefined}
        />
      </div>

      <div className="gear-card-body">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-black">{item.name}</h3>
          <span className={`rarity rarity-${item.rarity.toLowerCase()}`}>
            {item.rarity}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-ink-soft">
          <GameIcon name={item.icon} size={12} />
          {item.role}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          {item.description}
        </p>

        {item.gearType === 'relic' ? (
          <div className="relic-perks">
            <span className="relic-perk-positive">
              <GameIcon name="sparkles" size={13} />
              {item.perk}
            </span>
            <span className="relic-perk-tradeoff">
              <GameIcon name="target" size={13} />
              {item.tradeoff}
            </span>
          </div>
        ) : (
          <div className="gear-stats">
            {item.gearType !== 'armour' ? (
            <>
              <Stat label="Damage" value={item.damage ?? 0} tone="damage" />
              {item.gearType === 'magic' ? (
                <Stat label="Healing" value={`+${item.healing ?? 0}`} tone="heal" />
              ) : (
                <Stat
                  label="Critical"
                  value={`Every ${item.critEvery}`}
                  tone="critical"
                />
              )}
            </>
            ) : (
              <>
                <Stat label="Guard" value={item.defense ?? 0} tone="guard" />
                <Stat
                  label="Max HP"
                  value={`+${item.maxHpBonus ?? 0}`}
                  tone="health"
                />
              </>
            )}
          </div>
        )}

        {item.gearType === 'relic' ? (
          <div className="relic-sidegrade-label">
            <GameIcon name="sparkles" size={12} />
            Side-grade · choose for your strategy
          </div>
        ) : (
          <div className="gear-power">
            <span>Gear rating</span>
            <div>
              <i style={{ width: `${power}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="gear-card-action">
        {owned ? (
          <div className="owned-label">
            <GameIcon name="check" size={15} />
            Owned
          </div>
        ) : (
          <>
            <Button
              size="sm"
              variant={affordable ? 'primary' : 'ghost'}
              className={affordable ? '' : 'border-2 border-swan'}
              disabled={buyingDisabled || !affordable}
              onClick={onBuy}
              aria-label={`Buy ${item.name} for ${item.cost} coins`}
            >
              {buying ? (
                'Forging…'
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <PixelIcon name="coin" className="h-4 w-4" />
                  {item.cost}
                </span>
              )}
            </Button>
            {!affordable && (
              <span className="gear-shortfall">Need more coins</span>
            )}
          </>
        )}
      </div>
    </Card>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone: 'damage' | 'critical' | 'heal' | 'guard' | 'health'
}) {
  return (
    <span className={`gear-stat gear-stat-${tone}`}>
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  )
}

function gearPower(item: ShopItem): number {
  if (item.gearType === 'relic') return 50
  if (item.gearType === 'armour') {
    return Math.min(
      100,
      Math.round(((item.defense ?? 0) * 3 + (item.maxHpBonus ?? 0) / 3) / 1.06),
    )
  }
  if (item.gearType === 'magic') {
    return Math.min(
      100,
      Math.round(((item.damage ?? 0) + (item.healing ?? 0) * 1.4) / 1.65),
    )
  }
  return Math.min(100, Math.round(((item.damage ?? 0) / 150) * 100))
}

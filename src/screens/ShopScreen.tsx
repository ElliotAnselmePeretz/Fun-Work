import { useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { GameIcon } from '../components/GameIcon'
import { ScreenHeader } from '../components/ScreenHeader'
import { purchaseItem } from '../features/shop/shopActions'
import { useCoinSummary, useStreak } from '../hooks/useData'
import { multiplierLabel, nextCoinMultiplier } from '../lib/coins'
import { navigate } from '../lib/router'
import { isItemOwned, SHOP_ITEMS } from '../lib/shop'

export function ShopScreen() {
  const coins = useCoinSummary()
  const streak = useStreak()
  const [filter, setFilter] = useState<'weapon' | 'armour'>('weapon')
  const [buying, setBuying] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  if (!coins || !streak) return null

  const ownedCount = SHOP_ITEMS.filter((item) =>
    isItemOwned(item, coins.ownedItemIds),
  ).length
  const visibleItems = SHOP_ITEMS.filter((item) => item.gearType === filter)

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
    <div className="flex flex-col gap-5">
      <ScreenHeader
        title="The Armory"
        subtitle={`${ownedCount}/${SHOP_ITEMS.length} gear pieces unlocked`}
      />

      <section className="armory-banner">
        <div className="banner-grid" aria-hidden />
        <div className="relative z-10">
          <p className="banner-kicker">Build your loadout</p>
          <h2 className="mt-1 max-w-56 text-3xl font-black tracking-tight text-white">
            Prepare for the next fight.
          </h2>
          <p className="mt-2 max-w-60 text-sm font-bold leading-relaxed text-white/60">
            Pair weapon damage with armour guard, then take on a boss.
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
        <img
          src="/assets/gear/voidbreaker.png"
          alt=""
          className="armory-banner-art"
          aria-hidden="true"
        />
      </section>

      <div className="grid grid-cols-3 gap-2">
        <Card className="mini-stat">
          <GameIcon name="coins" size={18} className="text-gold-dark" />
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
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="section-kicker">Equipment forge</p>
            <h2 className="text-xl font-black">Choose your next upgrade</h2>
          </div>
          <div className="gear-tabs" aria-label="Gear type">
            <button
              type="button"
              onClick={() => setFilter('weapon')}
              className={filter === 'weapon' ? 'gear-tab-active' : ''}
            >
              Weapons
            </button>
            <button
              type="button"
              onClick={() => setFilter('armour')}
              className={filter === 'armour' ? 'gear-tab-active' : ''}
            >
              Armour
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {visibleItems.map((item) => {
            const owned = isItemOwned(item, coins.ownedItemIds)
            const affordable = coins.balance >= item.cost
            return (
              <Card
                key={item.id}
                className={`weapon-card ${owned ? 'weapon-card-owned' : ''}`}
              >
                {item.gearType === 'weapon' ? (
                  <div className="gear-art-frame">
                    <img src={item.image} alt="" className="gear-art gear-art-weapon" />
                  </div>
                ) : (
                  <div className="gear-art-frame armour-art-frame">
                    <img src={item.image} alt="" className="gear-art gear-art-armour" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-black">{item.name}</h3>
                    <span className={`rarity rarity-${item.rarity.toLowerCase()}`}>
                      {item.rarity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                    {item.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-black uppercase tracking-wide">
                    {item.gearType === 'weapon' ? (
                      <>
                        <span className="flex items-center gap-1 text-cardinal">
                          <GameIcon name="target" size={13} />
                          {item.damage} damage
                        </span>
                        <span className="flex items-center gap-1 text-violet">
                          <GameIcon name="zap" size={13} />
                          2× every {item.critEvery}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1 text-sky-dark">
                          <GameIcon name="shield" size={13} />
                          {item.defense} guard
                        </span>
                        <span className="text-grass-dark">
                          +{item.maxHpBonus} max HP
                        </span>
                      </>
                    )}
                    {item.starter && (
                      <span className="text-grass-dark">Starter gear</span>
                    )}
                  </div>
                </div>
                <div className="flex w-24 shrink-0 flex-col items-stretch justify-center">
                  {owned ? (
                    <div className="owned-label">
                      <GameIcon name="check" size={15} />
                      Owned
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant={affordable ? 'primary' : 'ghost'}
                      className={affordable ? '' : 'border-2 border-swan'}
                      disabled={buying !== null || !affordable}
                      onClick={() => void buy(item.id)}
                      aria-label={`Buy ${item.name} for ${item.cost} coins`}
                    >
                      {buying === item.id ? (
                        'Forging…'
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          <GameIcon name="coins" size={14} />
                          {item.cost}
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="weapon-icon">
            <GameIcon name="shield" size={25} />
          </div>
          <div>
            <h3 className="font-black">Loadout advice</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Weapons shorten a fight; armour determines how many counterattacks
              you can survive. A boss does not retaliate after the finishing blow.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

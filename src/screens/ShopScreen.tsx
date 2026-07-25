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
  const [buying, setBuying] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  if (!coins || !streak) return null

  const ownedCount = SHOP_ITEMS.filter((item) =>
    isItemOwned(item, coins.ownedItemIds),
  ).length

  const buy = async (itemId: string) => {
    setBuying(itemId)
    setMessage(null)
    try {
      await purchaseItem(itemId)
      const item = SHOP_ITEMS.find((candidate) => candidate.id === itemId)
      setMessage(`${item?.name ?? 'Weapon'} unlocked and ready for the arena.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not buy that weapon.')
    } finally {
      setBuying(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader
        title="The Armory"
        subtitle={`${ownedCount}/${SHOP_ITEMS.length} weapons unlocked`}
      />

      <section className="armory-banner">
        <div className="banner-grid" aria-hidden />
        <div className="relative z-10">
          <p className="banner-kicker">Build your loadout</p>
          <h2 className="mt-1 max-w-56 text-3xl font-black tracking-tight text-white">
            Better habits. Stronger gear.
          </h2>
          <p className="mt-2 max-w-60 text-sm font-bold leading-relaxed text-white/60">
            Earn coins from sessions, unlock weapons, then take them into battle.
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
        <div className="armory-mark" aria-hidden>
          <GameIcon name="sword" size={72} strokeWidth={1.2} />
        </div>
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
        <div className="mb-3">
          <p className="section-kicker">Weapon forge</p>
          <h2 className="text-xl font-black">Choose your next upgrade</h2>
        </div>

        <div className="flex flex-col gap-3">
          {SHOP_ITEMS.map((item) => {
            const owned = isItemOwned(item, coins.ownedItemIds)
            const affordable = coins.balance >= item.cost
            return (
              <Card
                key={item.id}
                className={`weapon-card ${owned ? 'weapon-card-owned' : ''}`}
              >
                <div className="weapon-icon">
                  <GameIcon name={item.icon} size={31} strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-black">{item.name}</h3>
                    <span className={`rarity rarity-${item.rarity.toLowerCase()}`}>
                      {item.rarity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                    {item.description}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] font-black uppercase tracking-wide">
                    <span className="flex items-center gap-1 text-cardinal">
                      <GameIcon name="target" size={13} />
                      {item.damage} damage
                    </span>
                    {item.starter && <span className="text-grass-dark">Starter gear</span>}
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
    </div>
  )
}

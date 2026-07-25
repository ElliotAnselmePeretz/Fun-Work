import { useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ScreenHeader } from '../components/ScreenHeader'
import { purchaseItem } from '../features/shop/shopActions'
import { useCoinSummary, useStreak } from '../hooks/useData'
import { multiplierLabel, nextCoinMultiplier } from '../lib/coins'
import { SHOP_ITEMS } from '../lib/shop'

export function ShopScreen() {
  const coins = useCoinSummary()
  const streak = useStreak()
  const [buying, setBuying] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  if (!coins || !streak) return null

  const buy = async (itemId: string) => {
    setBuying(itemId)
    setMessage(null)
    try {
      await purchaseItem(itemId)
      const item = SHOP_ITEMS.find((candidate) => candidate.id === itemId)
      setMessage(`${item?.emoji ?? '✨'} ${item?.name ?? 'Item'} added to your collection!`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not buy that item.')
    } finally {
      setBuying(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader
        title="Reward Shop"
        subtitle={`${coins.ownedItemIds.size}/${SHOP_ITEMS.length} treasures collected`}
      />

      <section className="coin-vault relative overflow-hidden rounded-[2rem] p-5 text-white">
        <div className="absolute -right-6 -top-8 text-8xl opacity-20" aria-hidden>
          🪙
        </div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
          Your coin pouch
        </p>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-4xl font-black">{coins.balance.toLocaleString()}</span>
          <span className="pb-1 text-2xl" aria-hidden>🪙</span>
        </div>
        <div className="mt-4 flex gap-2 text-xs font-extrabold">
          <span className="rounded-full bg-white/15 px-3 py-1.5">
            {coins.earned.toLocaleString()} earned
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1.5">
            {multiplierLabel(nextCoinMultiplier(streak))} next reward
          </span>
        </div>
      </section>

      {message && (
        <p role="status" className="rounded-2xl bg-gold/15 px-4 py-3 text-sm font-extrabold text-gold-dark">
          {message}
        </p>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="section-kicker">Quest rewards</p>
            <h2 className="text-xl font-black">Spend your wins</h2>
          </div>
          <span className="text-xs font-bold text-ink-soft">Yours forever</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {SHOP_ITEMS.map((item) => {
            const owned = coins.ownedItemIds.has(item.id)
            const affordable = coins.balance >= item.cost
            return (
              <Card
                key={item.id}
                className={`shop-item flex min-h-56 flex-col p-3 ${
                  owned ? 'shop-item-owned' : ''
                }`}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="shop-item-emoji" aria-hidden>{item.emoji}</span>
                  <span className={`rarity rarity-${item.rarity.toLowerCase()}`}>
                    {item.rarity}
                  </span>
                </div>
                <h3 className="font-black leading-tight">{item.name}</h3>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-soft">
                  {item.description}
                </p>
                {owned ? (
                  <div className="mt-3 rounded-xl bg-grass/10 py-2 text-center text-xs font-black uppercase tracking-wide text-grass-dark">
                    Owned ✓
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant={affordable ? 'primary' : 'ghost'}
                    className={`mt-3 w-full ${affordable ? '' : 'border-2 border-swan'}`}
                    disabled={buying !== null || !affordable}
                    onClick={() => void buy(item.id)}
                    aria-label={`Buy ${item.name} for ${item.cost} coins`}
                  >
                    {buying === item.id ? 'Buying…' : `${item.cost} 🪙`}
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      </section>

      <p className="px-4 text-center text-xs leading-relaxed text-ink-soft">
        Your balance and collection are rebuilt from your history—there is no stored
        coin counter to get out of sync.
      </p>
    </div>
  )
}

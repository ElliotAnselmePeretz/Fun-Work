import { computeCoinSummary, isPurchaseLog } from '../../lib/coins'
import { dayKey } from '../../lib/date'
import { db } from '../../lib/db'
import { newId } from '../../lib/id'
import { getShopItem } from '../../lib/shop'
import type { Id, PurchaseLogEntry } from '../../types'

export async function purchaseItem(itemId: Id): Promise<void> {
  await db.transaction('rw', db.logs, db.activities, async () => {
    const item = getShopItem(itemId)
    if (!item) throw new Error('That item is no longer in the shop.')

    const [ledger, activities] = await Promise.all([
      db.logs.toArray(),
      db.activities.toArray(),
    ])
    if (ledger.some((entry) => isPurchaseLog(entry) && entry.itemId === itemId)) {
      throw new Error('You already own this item.')
    }

    const summary = computeCoinSummary(ledger, activities)
    if (summary.balance < item.cost) {
      throw new Error(`You need ${item.cost - summary.balance} more coins.`)
    }

    const now = Date.now()
    const purchase: PurchaseLogEntry = {
      id: newId(),
      kind: 'purchase',
      itemId,
      coinCost: item.cost,
      at: now,
      day: dayKey(now),
    }
    await db.logs.add(purchase)
  })
}

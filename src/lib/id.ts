/**
 * Short, collision-resistant ids. crypto.randomUUID needs a secure context,
 * which we don't have when testing over plain http on a phone on the LAN.
 */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

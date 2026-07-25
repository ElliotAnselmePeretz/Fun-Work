import { GameIcon, type GameIconName } from './GameIcon'
import { hrefFor, type Route } from '../lib/router'

const TABS: { route: Route; label: string; icon: GameIconName }[] = [
  { route: { name: 'home' }, label: 'Home', icon: 'home' },
  { route: { name: 'arena' }, label: 'Arena', icon: 'swords' },
  { route: { name: 'shop' }, label: 'Armory', icon: 'store' },
  { route: { name: 'stats' }, label: 'Stats', icon: 'chart' },
  { route: { name: 'settings' }, label: 'Settings', icon: 'settings' },
]

interface TabBarProps {
  current: Route
}

/** Fixed bottom nav — thumb-reachable, and stays clear of the home indicator. */
export function TabBar({ current }: TabBarProps) {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-white/90 shadow-[0_-8px_30px_rgba(38,33,74,0.08)] backdrop-blur-xl">
      <ul className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active = tab.route.name === current.name
          return (
            <li key={tab.label} className="flex-1">
              <a
                href={hrefFor(tab.route)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-black uppercase tracking-wide transition-all ${
                  active ? 'text-violet' : 'text-hare'
                }`}
              >
                <span className={`transition-transform ${active ? '-translate-y-0.5 scale-110' : ''}`} aria-hidden>
                  <GameIcon name={tab.icon} size={21} strokeWidth={active ? 2.8 : 2.2} />
                </span>
                {tab.label}
                {active && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-violet" aria-hidden />
                )}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

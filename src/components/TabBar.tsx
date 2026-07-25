import { hrefFor, type Route } from '../lib/router'

const TABS: { route: Route; label: string; emoji: string }[] = [
  { route: { name: 'home' }, label: 'Home', emoji: '🏠' },
  { route: { name: 'badges' }, label: 'Badges', emoji: '🏅' },
  { route: { name: 'settings' }, label: 'Settings', emoji: '⚙️' },
]

interface TabBarProps {
  current: Route
}

/** Fixed bottom nav — thumb-reachable, and stays clear of the home indicator. */
export function TabBar({ current }: TabBarProps) {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t-2 border-swan bg-white">
      <ul className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active = tab.route.name === current.name
          return (
            <li key={tab.label} className="flex-1">
              <a
                href={hrefFor(tab.route)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-extrabold uppercase tracking-wide transition-colors ${
                  active ? 'text-grass' : 'text-hare'
                }`}
              >
                <span className={`text-xl ${active ? 'scale-110' : ''}`} aria-hidden>
                  {tab.emoji}
                </span>
                {tab.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

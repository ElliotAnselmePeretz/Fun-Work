import { TabBar } from './components/TabBar'
import { CelebrationModal } from './features/badges/CelebrationModal'
import { useRoute } from './hooks/useRoute'
import { hrefFor } from './lib/router'
import { ActivityScreen } from './screens/ActivityScreen'
import { ArenaScreen } from './screens/ArenaScreen'
import { BadgesScreen } from './screens/BadgesScreen'
import { BulkAddScreen } from './screens/BulkAddScreen'
import { HabitsScreen } from './screens/HabitsScreen'
import { ImageImportScreen } from './screens/ImageImportScreen'
import { OrganizeScreen } from './screens/OrganizeScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { ShopScreen } from './screens/ShopScreen'
import { StatsScreen } from './screens/StatsScreen'
import { WorkScreen } from './screens/WorkScreen'

function CurrentScreen() {
  const route = useRoute()

  switch (route.name) {
    case 'activity':
      // Keyed so switching activities remounts rather than reusing scroll and
      // level-path state from the previous one.
      return <ActivityScreen key={route.activityId} activityId={route.activityId} />
    case 'work':
      return <WorkScreen />
    case 'arena':
      return <ArenaScreen />
    case 'badges':
      return <BadgesScreen />
    case 'shop':
      return <ShopScreen />
    case 'bulk-add':
      return <BulkAddScreen />
    case 'image-add':
      return <ImageImportScreen />
    case 'organize':
      return <OrganizeScreen />
    case 'stats':
      return <StatsScreen />
    case 'settings':
      return <SettingsScreen />
    default:
      return <HabitsScreen />
  }
}

export default function App() {
  const route = useRoute()

  return (
    <div className="app-shell mx-auto min-h-full max-w-md">
      {/* Bottom padding clears the fixed tab bar. */}
      <main className="safe-top px-4 pb-28 pt-4">
        <div key={hrefFor(route)} className="page-enter">
          <CurrentScreen />
        </div>
      </main>
      <TabBar current={route} />
      <CelebrationModal />
    </div>
  )
}

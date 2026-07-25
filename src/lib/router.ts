/**
 * A hash router in ~40 lines. Full react-router would be a large dependency
 * for five screens, and the hash keeps the phone's back button working when
 * the app is installed to the home screen.
 */
export type Route =
  | { name: 'home' }
  | { name: 'activity'; activityId: string }
  | { name: 'badges' }
  | { name: 'bulk-add' }
  | { name: 'image-add' }
  | { name: 'organize' }
  | { name: 'stats' }
  | { name: 'settings' }

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '')
  const [head, param] = path.split('/')

  switch (head) {
    case 'activity':
      return param ? { name: 'activity', activityId: param } : { name: 'home' }
    case 'badges':
      return { name: 'badges' }
    case 'bulk-add':
      return { name: 'bulk-add' }
    case 'image-add':
      return { name: 'image-add' }
    case 'organize':
      return { name: 'organize' }
    case 'stats':
      return { name: 'stats' }
    case 'settings':
      return { name: 'settings' }
    default:
      return { name: 'home' }
  }
}

export function hrefFor(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/'
    case 'activity':
      return `#/activity/${route.activityId}`
    default:
      return `#/${route.name}`
  }
}

export function navigate(route: Route): void {
  window.location.hash = hrefFor(route)
}

export function goBack(): void {
  if (window.history.length > 1) window.history.back()
  else navigate({ name: 'home' })
}

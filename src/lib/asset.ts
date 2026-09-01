/**
 * Resolves a bundled asset path against the app's base URL.
 *
 * Vite rewrites `url()` in CSS and the script tags in index.html for you, but
 * it does *not* touch string literals in JavaScript. Every sprite path in this
 * app is a runtime string, so on GitHub Pages — where the app is served from
 * `/Fun-Work/` rather than `/` — a bare `/assets/…` resolved to the domain
 * root and every image 404'd. Routing them through here fixes that in one
 * place, and is a no-op locally where the base is `/`.
 */
const BASE = import.meta.env.BASE_URL

export function assetUrl(path: string): string {
  return `${BASE}${path.replace(/^\//, '')}`
}

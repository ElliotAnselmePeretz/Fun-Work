# Art credits

All bundled art is under the Creative Commons Zero (CC0) public-domain
dedication.

Everything in `gear/`, `areas/`, `avatars/` and `bosses/` comes from a
**single** source, so the armory, the journey terrain, activity icons and arena
read as one matched set rather than a collage:

- **Dungeon Crawl 32x32 tiles** by the Dungeon Crawl Stone Soup team
  (Chris Hamons and contributors):
  https://opengameart.org/content/dungeon-crawl-32x32-tiles
  The CC0 dedication ships as `LICENSE.txt` inside that release.

## How the art was prepared

Every sprite is trimmed to its drawn pixels, scaled by a whole number so it
stays crisp, and centred on a fixed canvas, so each armory card frames alike.
Boss portraits use the same nearest-neighbour preparation from Dungeon Crawl
Stone Soup monster tiles.
Area terrain is an 8×8 patchwork of the pack's own seamless floor tiles, laid
out with a per-area fixed seed — so a rebuild produces byte-identical ground,
and the 256px repeat is large enough to hide the pattern.

Gear art is ordered with the price ladder on purpose: starter pieces are a
plain knife, a wooden club and a roll of hide, while endgame pieces are gilded
and ornate. The tier should be legible before you read a single stat.

No attribution is required by CC0, but the creators and source pages are
recorded here with thanks.

Everything is bundled in `public/assets/` and precached by the service worker,
so the app works with no network.

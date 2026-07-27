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
out with a per-area fixed seed — so a rebuild produces byte-identical ground.
Later biomes re-colour and re-scale those same CC0 terrain families in CSS,
keeping one coherent art language while giving a long campaign twelve distinct
regions.

Gear art is ordered with the price ladder on purpose: starter pieces are a
plain knife, a wooden club and a roll of hide, while endgame pieces are gilded
and ornate. The tier should be legible before you read a single stat.

## Interface icons

`ui/` holds the small icons the interface itself uses — coins, flame, chest,
shop door, sword and the rest — prepared from the same Dungeon Crawl tileset so
a coin in the header is the same object as a coin in the world.

Four of them are **hand-drawn for this project** rather than taken from the
pack, because no tile in it reads as the thing needed: the tick (`check.png`,
`check-dim.png`), the plus, the cog and the bar chart. They are drawn on the
same pixel grid with the tileset's shaded lower-right edge, and are released
under CC0 along with everything else here.

No attribution is required by CC0, but the creators and source pages are
recorded here with thanks.

Everything is bundled in `public/assets/` and precached by the service worker,
so the app works with no network.

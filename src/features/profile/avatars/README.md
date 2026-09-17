# Profile avatar library — licensing

**All artwork in this directory is original vector art created for Longlivy.**

Every preset avatar in [`avatarArt.tsx`](./avatarArt.tsx) is drawn at runtime
from [`react-native-svg`](https://github.com/software-mansion/react-native-svg)
primitives (`Path`, `Circle`, `Ellipse`, `Line`, `Polyline`). There are:

- **no bitmap / image files** bundled for avatars,
- **no assets downloaded** from Google, stock sites or anywhere else,
- **no third-party icon packs** used (not even the ones already installed —
  `@expo/vector-icons` is untouched here),
- **no trademarked characters, celebrity likenesses or recognisable
  commercial artwork.**

The shapes are generic wellness/longevity motifs (a leaf, a droplet, a
seated figure, balance stones, a heartbeat trace, …). There is nothing here
to license and it is cleared for commercial / App Store use.

The initial-letter fallback ([`../components/UserAvatar.tsx`](../components/UserAvatar.tsx))
uses only the first character of the user's own name.

## If a future preset ever uses third-party art

Do not add it until its licence is verified. Then record here, per asset:
source URL, exact licence (CC0 / MIT / CC-BY / a named royalty-free
licence), and any required attribution text. Anything with unclear
ownership must not be added.

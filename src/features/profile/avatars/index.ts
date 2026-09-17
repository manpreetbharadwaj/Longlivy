import {
  AvatarArt,
  SproutAvatar,
  LeafAvatar,
  MeditationAvatar,
  BalanceAvatar,
  SunriseAvatar,
  HydrationAvatar,
  PulseAvatar,
  MountainAvatar,
  OrbitAvatar,
  SilhouetteAvatar,
  BloomAvatar,
} from './avatarArt';

/**
 * The `avatarId` persisted on the user profile for "use my initial" — also
 * the effective default: any id that doesn't resolve to a preset (unset,
 * this sentinel, or a stale id from an older build) renders the initial.
 */
export const INITIAL_AVATAR_ID = 'initial';

export interface AvatarPreset {
  /** Stable id persisted on the user profile — never an asset path, so it survives rebuilds. */
  id: string;
  /** Human label — used as the screen-reader label and the picker caption. */
  label: string;
  /** The bundled vector drawn for this preset. */
  Art: AvatarArt;
}

/**
 * The curated built-in set shown in the avatar picker. Order here is grid
 * order. Add, remove or rename freely: a profile pointing at an id no
 * longer in this list falls back to the initial letter (see
 * `isInitialAvatar`), so nothing breaks.
 */
export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'avatar_sprout', label: 'Sprout', Art: SproutAvatar },
  { id: 'avatar_leaf', label: 'Leaf', Art: LeafAvatar },
  { id: 'avatar_meditation', label: 'Meditation', Art: MeditationAvatar },
  { id: 'avatar_balance', label: 'Balance stones', Art: BalanceAvatar },
  { id: 'avatar_sunrise', label: 'Sunrise', Art: SunriseAvatar },
  { id: 'avatar_hydration', label: 'Hydration', Art: HydrationAvatar },
  { id: 'avatar_pulse', label: 'Heartbeat', Art: PulseAvatar },
  { id: 'avatar_mountain', label: 'Mountain', Art: MountainAvatar },
  { id: 'avatar_orbit', label: 'Vitality orbit', Art: OrbitAvatar },
  { id: 'avatar_silhouette', label: 'Silhouette', Art: SilhouetteAvatar },
  { id: 'avatar_bloom', label: 'Bloom', Art: BloomAvatar },
];

/** Resolve a stored id to its preset, or `undefined` for the initial-letter fallback. */
export const getAvatarPreset = (id?: string | null): AvatarPreset | undefined =>
  id ? AVATAR_PRESETS.find((preset) => preset.id === id) : undefined;

/** True when `id` should render the initial-letter fallback: unset, the `'initial'` sentinel, or a stale/unknown id. */
export const isInitialAvatar = (id?: string | null): boolean => !getAvatarPreset(id);

export type { AvatarArt, AvatarArtProps } from './avatarArt';

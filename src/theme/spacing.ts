/**
 * A more generous, editorial spacing scale than a tight 4px grid — bigger
 * jumps at the top end (lg/xl/xxl/xxxl) so hero sections and card stacks
 * get real breathing room instead of feeling packed.
 */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 56,
};

/**
 * Softer, slightly larger corners than a tight/technical radius scale —
 * matches the "comfort" read the brand name asks for, without going all the
 * way to a fully rounded/pill-heavy look everywhere.
 */
export const radius = {
  sm: 12,
  md: 18,
  lg: 22,
  xl: 26,
  pill: 999,
  /** A deliberately small, fixed corner radius for progress-bar tracks/fills — independent of bar height, so bars read as clean and rectangular rather than pill-shaped regardless of how tall a given bar is. */
  flat: 3,
};

export const componentSizes = {
  buttonHeight: 54,
  inputHeight: 54,
  touchTarget: 44,
  iconSmall: 18,
  iconMedium: 24,
  iconLarge: 32,
  tabBarHeight: 64,
};

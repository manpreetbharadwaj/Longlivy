import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFloatingTabBarHeight } from './FloatingTabBar';

/**
 * How much bottom padding a screen's scrollable content needs to clear the
 * floating tab bar, which is an absolutely-positioned overlay (not a normal
 * layout sibling — see FloatingTabBar's own doc comment for why) and so
 * doesn't automatically reserve space the way a docked tab bar would.
 * Centralized here rather than each screen guessing a number, so the value
 * only needs to change in one place if the bar's own dimensions ever do.
 */
export function useFloatingTabBarSpacing(): number {
  const insets = useSafeAreaInsets();
  return getFloatingTabBarHeight(insets.bottom);
}

import { useContext } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { getFloatingTabBarHeight } from './FloatingTabBar';

/**
 * The bottom footprint of the floating tab bar, which is an absolutely
 * positioned overlay (see FloatingTabBar's doc comment for why) and so
 * doesn't reserve layout space the way a docked tab bar would.
 *
 * Screens reserve this below their scroll viewport (a bottom margin, not
 * content padding), so content ends above the bar instead of scrolling
 * underneath it — nothing interactive can sit under the pill or the raised
 * Home button at any scroll position.
 *
 * 0 outside the tab navigator (auth and onboarding stacks), where there is
 * no bar to clear.
 */
export function useFloatingTabBarSpacing(): number {
  const insets = useSafeAreaInsets();
  const insideTabs = useContext(BottomTabBarHeightContext) !== undefined;
  return insideTabs ? getFloatingTabBarHeight(insets.bottom) : 0;
}

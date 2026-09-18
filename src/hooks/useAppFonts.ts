import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';

/**
 * Loads every named font file `theme/typography.ts`'s `fontFamily` tokens
 * reference. Call once, at the app root, and don't render anything that
 * uses `AppText`/theme typography until this returns `true` — a custom
 * `fontFamily` that hasn't finished loading yet silently falls back to the
 * platform default, which would show a flash of system-font text right
 * before the real font pops in.
 */
export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  return loaded;
}

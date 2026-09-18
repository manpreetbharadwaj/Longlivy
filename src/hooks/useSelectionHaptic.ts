import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useAppPreferences } from '@/contexts/AppPreferencesContext';

/** A light selection tick, gated by the user's haptics preference — shared by every tap-to-select tile so the gating check isn't reimplemented per screen (same gating LanguageWheelPicker does inline). */
export function useSelectionHaptic(): () => void {
  const { preferences } = useAppPreferences();
  return useCallback(() => {
    if (preferences.hapticsEnabled) Haptics.selectionAsync();
  }, [preferences.hapticsEnabled]);
}

import React, { useCallback, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FastingStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppText } from '@/components/common/AppText';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch } from '@/store/hooks';
import { startFastThunk } from '@/features/fasting/fastingSlice';

export const CustomFastingScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<FastingStackParamList>>();
  const dispatch = useAppDispatch();
  const [hours, setHours] = useState('16');
  // See the same guard on SelectFastingMethodScreen's `confirmStart` — a ref
  // updates synchronously, so it (unlike Redux state + a re-render) actually
  // blocks a second tap from dispatching a second start before the first
  // one resolves.
  const isStartingRef = useRef(false);

  const start = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    try {
      // Already-active sessions never get a duplicate created for them (see
      // MockFastingRepository.startFast) — either way, the existing/new fast
      // is what the timeline screen should show.
      await dispatch(startFastThunk({ method: 'individual', customHours: Number(hours) || 16 })).unwrap();
      navigation.replace('ActiveFast');
    } catch {
      // Rejected — stay on this screen rather than navigating on a failed start.
    } finally {
      isStartingRef.current = false;
    }
  }, [dispatch, hours, navigation]);

  return (
    <>
      <AppHeader title="Custom fast" onBack={() => navigation.goBack()} />
      <AppScreen>
        <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.md }}>
          Set your own fasting duration. The end time is calculated automatically from the start time.
        </AppText>
        <AppInput label="Duration (hours)" value={hours} onChangeText={setHours} keyboardType="numeric" style={{ marginBottom: theme.spacing.md }} />
        <AppButton label="Start custom fast" onPress={start} />
      </AppScreen>
    </>
  );
};
